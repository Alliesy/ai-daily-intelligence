import type { DailyPacket, DailySource, IdentityRegistries, JsonObject } from "./types.js";
import { normalizeUrl } from "./url-normalization.js";

export const SOURCE_TAXONOMY_VERSION = "source-taxonomy-v1";

export interface ProjectedSource extends DailySource {
  raw_url: string;
  source_type: "official_blog" | "article" | "youtube" | "x" | "github" | "paper" | "documentation" | "other";
  authority: "official" | "primary" | "independent" | "unknown";
  taxonomy_mapping_status: "confirmed" | "rule_mapped" | "unknown";
  taxonomy_rule_version: typeof SOURCE_TAXONOMY_VERSION | null;
  provider: string | null;
  external_id: string | null;
  thumbnail_url: string | null;
  verification_status: "verified" | "unverified";
  normalization_metadata: JsonObject;
}

export function projectDailyPacket(packet: DailyPacket, registries: IdentityRegistries): DailyPacket {
  const sourceCanonicalByUrl = buildSourceLookup(registries);
  const projected = structuredClone(packet);

  projected.news = projected.news.map((news) => {
    const rawOriginalUrl = news.original_url;
    const normalizedOriginal = normalizeSourceIdentityUrl(rawOriginalUrl, sourceCanonicalByUrl);
    const sources = news.sources.map((source) => projectSource(source, sourceCanonicalByUrl));
    if (!sources.some((source) => source.url === normalizedOriginal)) {
      throw new Error(`Normalized original_url is not present in sources for event ${news.event_key}`);
    }
    return {
      ...news,
      original_raw_url: rawOriginalUrl,
      original_url: normalizedOriginal,
      sources,
    };
  });

  projected.tools = projected.tools.map(normalizeResourceUrl);
  projected.worth_reading = projected.worth_reading.map(normalizeResourceUrl);
  projected.community = projected.community.map(normalizeResourceUrl);
  return projected;
}

function projectSource(source: DailySource, lookup: Map<string, string>): ProjectedSource {
  const rawUrl = source.url;
  const canonicalUrl = normalizeSourceIdentityUrl(rawUrl, lookup);
  const normalized = normalizeUrl(canonicalUrl);
  const taxonomy = classifySource(canonicalUrl, normalized.provider);

  return {
    ...source,
    raw_url: rawUrl,
    url: canonicalUrl,
    ...taxonomy,
    taxonomy_rule_version: taxonomy.taxonomy_mapping_status === "unknown" ? null : SOURCE_TAXONOMY_VERSION,
    provider: normalized.provider,
    external_id: normalized.externalId,
    thumbnail_url: normalized.provider === "youtube" && normalized.externalId !== null
      ? `https://i.ytimg.com/vi/${normalized.externalId}/hqdefault.jpg`
      : null,
    normalization_metadata: normalized.metadata,
  };
}

function classifySource(
  url: string,
  provider: "youtube" | "x" | "github" | null,
): Pick<ProjectedSource, "source_type" | "authority" | "taxonomy_mapping_status" | "verification_status"> {
  const hostname = new URL(url).hostname;
  if (hostname === "ai.meta.com") {
    return { source_type: "official_blog", authority: "official", taxonomy_mapping_status: "confirmed", verification_status: "unverified" };
  }
  if (hostname === "digital-strategy.ec.europa.eu" || hostname === "ai-act-service-desk.ec.europa.eu") {
    return { source_type: "documentation", authority: "official", taxonomy_mapping_status: "confirmed", verification_status: "unverified" };
  }
  if (hostname === "apnews.com" || hostname === "www.wired.com" || hostname === "www.businessinsider.com") {
    return { source_type: "article", authority: "independent", taxonomy_mapping_status: "confirmed", verification_status: "unverified" };
  }
  if (hostname === "arxiv.org") {
    return { source_type: "paper", authority: "primary", taxonomy_mapping_status: "rule_mapped", verification_status: "unverified" };
  }
  if (provider === "github") {
    return { source_type: "github", authority: "unknown", taxonomy_mapping_status: "rule_mapped", verification_status: "unverified" };
  }
  if (provider === "youtube" || provider === "x") {
    return { source_type: provider, authority: "unknown", taxonomy_mapping_status: "rule_mapped", verification_status: "unverified" };
  }
  return { source_type: "other", authority: "unknown", taxonomy_mapping_status: "unknown", verification_status: "unverified" };
}

function normalizeResourceUrl(resource: JsonObject): JsonObject {
  if (typeof resource.url !== "string") return resource;
  const rawUrl = resource.url;
  return { ...resource, raw_url: rawUrl, url: normalizeUrl(rawUrl).normalizedUrl };
}

function buildSourceLookup(registries: IdentityRegistries): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const source of registries.sources.sources) {
    const canonical = normalizeUrl(source.canonical_url).normalizedUrl;
    for (const value of [source.canonical_url, ...source.aliases]) {
      lookup.set(normalizeUrl(value).normalizedUrl, canonical);
    }
  }
  return lookup;
}

function normalizeSourceIdentityUrl(rawUrl: string, lookup: Map<string, string>): string {
  const normalized = normalizeUrl(rawUrl).normalizedUrl;
  return lookup.get(normalized) ?? normalized;
}
