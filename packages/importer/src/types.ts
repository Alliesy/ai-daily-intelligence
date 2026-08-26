export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface EventIdentity extends JsonObject {
  event_uid: string;
  identity_seed: string;
  canonical_key: string;
  aliases: string[];
  merged_into_event_uid: string | null;
  reason: string;
  first_seen_date: string;
}

export interface EventRegistry extends JsonObject {
  schema_version: "1.0";
  namespace_uuid: string;
  generated_from_commit: string;
  events: EventIdentity[];
}

export interface SourceIdentity extends JsonObject {
  source_uid: string;
  identity_seed: string;
  canonical_url: string;
  aliases: string[];
  provider: string | null;
  external_id: string | null;
  merged_into_source_uid: string | null;
  reason: string;
}

export interface SourceRegistry extends JsonObject {
  schema_version: "1.0";
  namespace_uuid: string;
  normalization_version: string;
  generated_from_commit: string;
  sources: SourceIdentity[];
}

export interface DailySource extends JsonObject {
  title: string;
  url: string;
  publisher: string;
  published_at: string;
  tier: "A" | "B" | "C";
}

export type SourceType =
  | "official_blog" | "article" | "youtube" | "x" | "github" | "paper"
  | "documentation" | "reddit" | "hackernews" | "other";
export type SourceAuthority = "official" | "primary" | "independent" | "analysis" | "community" | "unknown";
export type VerificationStatus = "verified" | "corroborated" | "unverified" | "disputed";

export interface MorningPaper extends JsonObject {
  insight_headline: string;
  insight_summary: string;
  insight_method: "cross_event_signal_v1";
  evidence_event_keys: string[];
  top_event_keys: string[];
}

export interface GateResult extends JsonObject {
  status: "pass" | "fail" | "unknown";
  evidence: string;
}

export interface RealismGates extends JsonObject {
  customer: GateResult;
  pain: GateResult;
  existing_solution: GateResult;
  technology_change: GateResult;
  buildability: GateResult;
  mvp: GateResult;
  customer_access: GateResult;
  replacement_risk: GateResult;
  dependency: GateResult;
}

export interface ProblemEvidence extends JsonObject {
  url: string;
  source_type: SourceType;
  summary: string;
}

export interface DailyIdea extends JsonObject {
  name: string;
}

export interface DailyNews extends JsonObject {
  event_key: string;
  original_url: string;
  sources: DailySource[];
}

export interface DailyPacket extends JsonObject {
  schema_version: "1.0";
  date_kst: string;
  generated_at: string;
  status: "complete" | "partial";
  news: DailyNews[];
  business_ideas: DailyIdea[];
  tools: JsonObject[];
  community: JsonObject[];
  worth_reading: JsonObject[];
}

export interface IdentityRegistries {
  events: EventRegistry;
  sources: SourceRegistry;
}

export interface SyncCursor {
  packet_path: string;
  authoritative_commit_sha: string;
  authoritative_revision: number | null;
  authoritative_checksum: string;
  authoritative_projection_checksum: string;
  updated_at?: string;
}

export interface RpcError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export interface RpcResult<T> {
  data: T | null;
  error: RpcError | null;
}

export interface RpcClient {
  rpc<T>(functionName: string, parameters: Record<string, unknown>): Promise<RpcResult<T>>;
}

export interface GitRunResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface GitRunner {
  run(args: readonly string[]): Promise<GitRunResult>;
}
