import type {
  DailyPacket,
  DailySource,
  IdentityRegistries,
  JsonObject,
  SourceAuthority,
  SourceType,
  VerificationStatus,
} from "./types.js";
import { normalizeUrl } from "./url-normalization.js";

export const SOURCE_TAXONOMY_VERSION = "source-taxonomy-v1.1";

const SOURCE_TYPES = new Set<SourceType>([
  "official_blog", "article", "youtube", "x", "github", "paper",
  "documentation", "reddit", "hackernews", "other",
]);
const SOURCE_AUTHORITIES = new Set<SourceAuthority>([
  "official", "primary", "independent", "analysis", "community", "unknown",
]);
const VERIFICATION_STATUSES = new Set<VerificationStatus>([
  "verified", "corroborated", "unverified", "disputed",
]);
const REALISM_GATE_KEYS = [
  "customer", "pain", "existing_solution", "technology_change", "buildability",
  "mvp", "customer_access", "replacement_risk", "dependency",
] as const;

export interface ProjectedSource extends DailySource {
  raw_url: string;
  source_type: SourceType;
  authority: SourceAuthority;
  taxonomy_mapping_status: "confirmed" | "rule_mapped" | "unknown";
  taxonomy_rule_version: typeof SOURCE_TAXONOMY_VERSION | null;
  provider: string | null;
  external_id: string | null;
  thumbnail_url: string | null;
  verification_status: VerificationStatus;
  normalization_metadata: JsonObject;
}

export function projectDailyPacket(packet: DailyPacket, registries: IdentityRegistries): DailyPacket {
  validateV11Semantics(packet);
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
  const taxonomy = explicitTaxonomy(source) ?? classifySource(canonicalUrl, normalized.provider);
  const verificationStatus = isVerificationStatus(source.verification_status)
    ? source.verification_status
    : "unverified";

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
    verification_status: verificationStatus,
    ...(typeof source.evidence_group === "string" && source.evidence_group.length > 0
      ? { evidence_group: source.evidence_group }
      : {}),
  };
}

function explicitTaxonomy(
  source: DailySource,
): Pick<ProjectedSource, "source_type" | "authority" | "taxonomy_mapping_status" | "verification_status"> | null {
  if (!isSourceType(source.source_type) || !isSourceAuthority(source.authority)) return null;
  return {
    source_type: source.source_type,
    authority: source.authority,
    taxonomy_mapping_status: "confirmed",
    verification_status: isVerificationStatus(source.verification_status) ? source.verification_status : "unverified",
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

function isSourceType(value: unknown): value is SourceType {
  return typeof value === "string" && SOURCE_TYPES.has(value as SourceType);
}

function isSourceAuthority(value: unknown): value is SourceAuthority {
  return typeof value === "string" && SOURCE_AUTHORITIES.has(value as SourceAuthority);
}

function isVerificationStatus(value: unknown): value is VerificationStatus {
  return typeof value === "string" && VERIFICATION_STATUSES.has(value as VerificationStatus);
}

function validateV11Semantics(packet: DailyPacket): void {
  const eventKeys = new Set(packet.news.map((event) => event.event_key));
  const morningPaper = packet.morning_paper as import("./types.js").MorningPaper | undefined;
  if (morningPaper !== undefined) {
    for (const key of [...morningPaper.evidence_event_keys, ...morningPaper.top_event_keys]) {
      if (!eventKeys.has(key)) throw new Error(`morning_paper references Event outside this packet: ${key}`);
    }
  }

  const eligibleIdeas = packet.business_ideas.filter((idea) => idea.today_eligible === true);
  if (eligibleIdeas.length > 1) throw new Error("At most one business idea may be today_eligible");
  for (const idea of eligibleIdeas) {
    if (idea.eligibility_method !== "opportunity_gate_v1") {
      throw new Error(`Eligible opportunity uses an unsupported eligibility method: ${idea.name}`);
    }
    if (!Array.isArray(idea.problem_evidence) || idea.problem_evidence.length === 0) {
      throw new Error(`Eligible opportunity requires Problem Evidence: ${idea.name}`);
    }
    const realismGates = idea.realism_gates as import("./types.js").RealismGates | undefined;
    if (realismGates === undefined || REALISM_GATE_KEYS.some((key) => {
      const gate = realismGates[key];
      return gate.status !== "pass" || gate.evidence.trim().length === 0;
    })) {
      throw new Error(`Eligible opportunity requires all nine realism gates to pass: ${idea.name}`);
    }
  }
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
