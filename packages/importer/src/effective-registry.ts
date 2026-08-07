import { createHash } from "node:crypto";
import type {
  DailyPacket,
  EventIdentity,
  IdentityRegistries,
  SourceIdentity,
} from "./types.js";
import { normalizeUrl } from "./url-normalization.js";
import { validateRegistrySemantics } from "./validation.js";

export function buildEffectiveRegistries(
  explicit: IdentityRegistries,
  archivePackets: readonly DailyPacket[],
  generatedFromCommit: string,
): IdentityRegistries {
  const effective = structuredClone(explicit);
  effective.events.generated_from_commit = generatedFromCommit;
  effective.sources.generated_from_commit = generatedFromCommit;

  const eventByKey = new Map<string, EventIdentity>();
  for (const identity of effective.events.events) {
    for (const key of [identity.canonical_key, ...identity.aliases]) eventByKey.set(key, identity);
  }
  const sourceByUrl = new Map<string, SourceIdentity>();
  for (const identity of effective.sources.sources) {
    for (const value of [identity.canonical_url, ...identity.aliases]) {
      sourceByUrl.set(normalizeUrl(value).normalizedUrl, identity);
    }
  }

  const orderedPackets = [...archivePackets].sort((left, right) =>
    left.date_kst.localeCompare(right.date_kst) || left.generated_at.localeCompare(right.generated_at));
  for (const packet of orderedPackets) {
    for (const event of packet.news) {
      if (!eventByKey.has(event.event_key)) {
        const seed = `event:${event.event_key}`;
        const identity: EventIdentity = {
          event_uid: uuidV5(effective.events.namespace_uuid, seed),
          identity_seed: event.event_key,
          canonical_key: event.event_key,
          aliases: [],
          merged_into_event_uid: null,
          reason: "Deterministically discovered from the canonical daily archive.",
          first_seen_date: packet.date_kst,
        };
        effective.events.events.push(identity);
        eventByKey.set(event.event_key, identity);
      }

      for (const source of event.sources) {
        const normalized = normalizeUrl(source.url);
        if (sourceByUrl.has(normalized.normalizedUrl)) continue;
        const seed = `source:${normalized.normalizedUrl}`;
        const identity: SourceIdentity = {
          source_uid: uuidV5(effective.sources.namespace_uuid, seed),
          identity_seed: normalized.normalizedUrl,
          canonical_url: normalized.normalizedUrl,
          aliases: [],
          provider: normalized.provider,
          external_id: normalized.externalId,
          merged_into_source_uid: null,
          reason: "Deterministically discovered from the canonical daily archive.",
        };
        effective.sources.sources.push(identity);
        sourceByUrl.set(normalized.normalizedUrl, identity);
      }
    }
  }

  effective.events.events.sort((left, right) => left.event_uid.localeCompare(right.event_uid));
  effective.sources.sources.sort((left, right) => left.source_uid.localeCompare(right.source_uid));
  validateRegistrySemantics(effective);
  return effective;
}

export function uuidV5(namespaceUuid: string, name: string): string {
  const namespace = Buffer.from(namespaceUuid.replaceAll("-", ""), "hex");
  if (namespace.length !== 16) throw new Error(`Invalid UUID namespace: ${namespaceUuid}`);
  const bytes = createHash("sha1").update(namespace).update(name, "utf8").digest().subarray(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const value = bytes.toString("hex");
  return [value.slice(0, 8), value.slice(8, 12), value.slice(12, 16), value.slice(16, 20), value.slice(20)].join("-");
}
