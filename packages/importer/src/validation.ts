import { readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import type { ErrorObject, ValidateFunction } from "ajv";
import type { DailyPacket, EventRegistry, IdentityRegistries, JsonValue, SourceRegistry } from "./types.js";
import { normalizeUrl, URL_NORMALIZATION_VERSION } from "./url-normalization.js";

interface AjvLike {
  compile(schema: unknown): ValidateFunction;
}

const require = createRequire(import.meta.url);
const Ajv2020 = (require("ajv/dist/2020.js") as { default: new (options: Record<string, unknown>) => AjvLike }).default;
const addFormats = (require("ajv-formats") as { default: (ajv: AjvLike) => void }).default;

export interface SchemaPaths {
  daily: string;
  events: string;
  sources: string;
}

export interface Validators {
  daily: ValidateFunction;
  events: ValidateFunction;
  sources: ValidateFunction;
}

export function defaultSchemaPaths(repoRoot: string): SchemaPaths {
  return {
    daily: path.join(repoRoot, "schema", "daily.schema.json"),
    events: path.join(repoRoot, "schema", "event-aliases.schema.json"),
    sources: path.join(repoRoot, "schema", "source-aliases.schema.json"),
  };
}

export async function createValidators(paths: SchemaPaths): Promise<Validators> {
  const [dailySchema, eventSchema, sourceSchema] = await Promise.all([
    readJson(paths.daily), readJson(paths.events), readJson(paths.sources),
  ]);
  // The canonical v1 schema uses `required` inside `contains` without repeating
  // `type: object`; that is valid JSON Schema, but Ajv's strictTypes lint rejects it.
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictTypes: false });
  addFormats(ajv);
  return {
    daily: ajv.compile(dailySchema),
    events: ajv.compile(eventSchema),
    sources: ajv.compile(sourceSchema),
  };
}

export function validateDailyPacket(value: unknown, validator: ValidateFunction): asserts value is DailyPacket {
  assertSchema(value, validator, "daily packet");
}

export function validateRegistries(value: IdentityRegistries, validators: Validators): void {
  assertSchema(value.events, validators.events, "event identity registry");
  assertSchema(value.sources, validators.sources, "source identity registry");
  validateRegistrySemantics(value);
}

export function validateRegistrySemantics(registries: IdentityRegistries): void {
  if (registries.events.namespace_uuid !== registries.sources.namespace_uuid) {
    throw new Error("Event and Source registries must use the same namespace_uuid");
  }
  if (registries.sources.normalization_version !== URL_NORMALIZATION_VERSION) {
    throw new Error(`Unsupported Source normalization version: ${registries.sources.normalization_version}`);
  }

  assertUniqueField(registries.events.events.map((identity) => identity.event_uid), "event_uid");
  assertUniqueField(registries.sources.sources.map((identity) => identity.source_uid), "source_uid");

  assertUniqueIdentityValues(
    registries.events.events.map((identity) => ({
      owner: identity.event_uid,
      values: [identity.canonical_key, ...identity.aliases],
    })),
    "event key",
  );
  assertMergeTargets(
    registries.events.events.map((identity) => ({ id: identity.event_uid, target: identity.merged_into_event_uid })),
    "Event",
  );

  assertUniqueIdentityValues(
    registries.sources.sources.map((identity) => ({
      owner: identity.source_uid,
      values: [identity.canonical_url, ...identity.aliases].map((url) => normalizeUrl(url).normalizedUrl),
    })),
    "source URL",
  );
  for (const identity of registries.sources.sources) {
    for (const registryUrl of [identity.canonical_url, ...identity.aliases]) {
      if (normalizeUrl(registryUrl).normalizedUrl !== registryUrl) {
        throw new Error(`Source registry URL is not normalized (${identity.source_uid}): ${registryUrl}`);
      }
    }
  }
  assertMergeTargets(
    registries.sources.sources.map((identity) => ({ id: identity.source_uid, target: identity.merged_into_source_uid })),
    "Source",
  );
}

function assertUniqueField(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label} in identity registry`);
}

export function validateRegistryTransition(previous: IdentityRegistries, next: IdentityRegistries): void {
  validateRegistrySemantics(previous);
  validateRegistrySemantics(next);
  if (previous.events.namespace_uuid !== next.events.namespace_uuid ||
      previous.sources.namespace_uuid !== next.sources.namespace_uuid) {
    throw new Error("Identity registry namespace_uuid is immutable");
  }
  if (previous.sources.normalization_version !== next.sources.normalization_version) {
    throw new Error("Source normalization_version requires an explicit migration, not an in-place registry update");
  }

  assertAppendOnly(
    previous.events.events,
    next.events.events,
    (identity) => identity.event_uid,
    (identity) => identity.identity_seed,
    (identity) => identity.canonical_key,
    (identity) => identity.aliases,
    "Event",
  );
  assertAppendOnly(
    previous.sources.sources,
    next.sources.sources,
    (identity) => identity.source_uid,
    (identity) => identity.identity_seed,
    (identity) => identity.canonical_url,
    (identity) => identity.aliases,
    "Source",
  );
}

export function validatePacketIdentities(packet: DailyPacket, registries: IdentityRegistries): void {
  const eventOwners = new Map<string, Set<string>>();
  for (const identity of registries.events.events) {
    for (const key of [identity.canonical_key, ...identity.aliases]) addOwner(eventOwners, key, identity.event_uid);
  }
  const sourceOwners = new Map<string, Set<string>>();
  for (const identity of registries.sources.sources) {
    for (const url of [identity.canonical_url, ...identity.aliases]) {
      addOwner(sourceOwners, normalizeUrl(url).normalizedUrl, identity.source_uid);
    }
  }

  for (const event of packet.news) {
    requireSingleOwner(eventOwners, event.event_key, `Event identity for ${event.event_key}`);
    for (const source of event.sources) {
      const normalized = normalizeUrl(source.url).normalizedUrl;
      requireSingleOwner(sourceOwners, normalized, `Source identity for ${source.url}`);
    }
  }
}

export async function parseDailyPacket(raw: Uint8Array, validator: ValidateFunction): Promise<DailyPacket> {
  const value: unknown = JSON.parse(Buffer.from(raw).toString("utf8"));
  validateDailyPacket(value, validator);
  return value;
}

export async function parseRegistries(
  rawEvents: Uint8Array,
  rawSources: Uint8Array,
  validators: Validators,
): Promise<IdentityRegistries> {
  const events = JSON.parse(Buffer.from(rawEvents).toString("utf8")) as EventRegistry;
  const sources = JSON.parse(Buffer.from(rawSources).toString("utf8")) as SourceRegistry;
  const registries = { events, sources };
  validateRegistries(registries, validators);
  return registries;
}

function assertSchema(value: unknown, validator: ValidateFunction, label: string): void {
  if (!validator(value)) {
    throw new Error(`${label} failed JSON Schema validation: ${formatErrors(validator.errors)}`);
  }
}

function formatErrors(errors: ErrorObject[] | null | undefined): string {
  return (errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`).join("; ");
}

async function readJson(filePath: string): Promise<JsonValue> {
  return JSON.parse(await readFile(filePath, "utf8")) as JsonValue;
}

function assertUniqueIdentityValues(
  entries: Array<{ owner: string; values: string[] }>,
  label: string,
): void {
  const owners = new Map<string, Set<string>>();
  for (const entry of entries) {
    for (const value of entry.values) addOwner(owners, value, entry.owner);
  }
  for (const [value, valueOwners] of owners) {
    if (valueOwners.size !== 1) throw new Error(`Ambiguous ${label}: ${value}`);
  }
}

function assertMergeTargets(entries: Array<{ id: string; target: string | null }>, label: string): void {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  for (const entry of entries) {
    if (entry.target === null) continue;
    if (entry.target === entry.id) throw new Error(`${label} identity cannot merge into itself: ${entry.id}`);
    const target = byId.get(entry.target);
    if (target === undefined) throw new Error(`${label} merge target is missing: ${entry.target}`);
    if (target.target !== null) throw new Error(`${label} merge chains are not supported: ${entry.id}`);
  }
}

function assertAppendOnly<T>(
  previous: T[],
  next: T[],
  id: (value: T) => string,
  seed: (value: T) => string,
  canonical: (value: T) => string,
  aliases: (value: T) => string[],
  label: string,
): void {
  const nextById = new Map(next.map((identity) => [id(identity), identity]));
  for (const oldIdentity of previous) {
    const current = nextById.get(id(oldIdentity));
    if (current === undefined) throw new Error(`${label} registry cannot omit identity ${id(oldIdentity)}`);
    if (seed(current) !== seed(oldIdentity)) throw new Error(`${label} identity_seed is immutable: ${id(oldIdentity)}`);
    const oldCanonical = canonical(oldIdentity);
    const newCanonical = canonical(current);
    const currentAliases = new Set(aliases(current));
    if (oldCanonical !== newCanonical && !currentAliases.has(oldCanonical)) {
      throw new Error(`${label} canonical rename must preserve the prior canonical value as an alias: ${id(oldIdentity)}`);
    }
    for (const oldAlias of aliases(oldIdentity)) {
      if (oldAlias !== newCanonical && !currentAliases.has(oldAlias)) {
        throw new Error(`${label} registry cannot remove alias ${oldAlias}`);
      }
    }
  }
}

function addOwner(index: Map<string, Set<string>>, key: string, owner: string): void {
  const owners = index.get(key) ?? new Set<string>();
  owners.add(owner);
  index.set(key, owners);
}

function requireSingleOwner(index: Map<string, Set<string>>, key: string, label: string): void {
  const owners = index.get(key);
  if (owners === undefined || owners.size !== 1) throw new Error(`${label} is missing or ambiguous`);
}
