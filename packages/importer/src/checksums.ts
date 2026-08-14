import { createHash } from "node:crypto";
import type { IdentityRegistries, JsonValue } from "./types.js";

export const MAPPER_VERSION = "daily-projection-v1";

export function canonicalJson(value: JsonValue): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  const fields = Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`);
  return `{${fields.join(",")}}`;
}

export function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

export function rawChecksum(rawPacket: Uint8Array): string {
  return sha256(rawPacket);
}

export function registryChecksum(registries: IdentityRegistries): string {
  return sha256(canonicalJson({
    events: {
      schema_version: registries.events.schema_version,
      namespace_uuid: registries.events.namespace_uuid,
      identities: registries.events.events,
    },
    sources: {
      schema_version: registries.sources.schema_version,
      namespace_uuid: registries.sources.namespace_uuid,
      normalization_version: registries.sources.normalization_version,
      identities: registries.sources.sources,
    },
  }));
}

export function projectionInputChecksum(
  raw: string,
  registry: string,
  mapperVersion = MAPPER_VERSION,
): string {
  return sha256(canonicalJson({
    mapper_version: mapperVersion,
    raw_checksum: raw,
    registry_checksum: registry,
  }));
}
