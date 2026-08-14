export type Importance = "S" | "A" | "B";
export type SourceType =
  | "official_blog"
  | "article"
  | "youtube"
  | "x"
  | "github"
  | "paper"
  | "documentation"
  | "reddit"
  | "hackernews"
  | "other";
export type Authority = "official" | "primary" | "independent" | "analysis" | "community" | "unknown";
export type VerificationStatus = "verified" | "corroborated" | "unverified" | "disputed";

export interface SourceDto {
  id: string;
  title: string;
  publisher: string;
  url: string;
  sourceType: SourceType;
  authority: Authority;
  verificationStatus: VerificationStatus;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  isPrimary: boolean;
}

export interface OriginalContentDto {
  mode: "translation" | "detailed_summary" | "unavailable";
  label: string;
  sections: { title: string; body: string }[];
}

export interface EventDto {
  id: string;
  slug: string;
  title: string;
  oneLineSummary: string;
  importance: Importance;
  impact: string;
  fact: string | null;
  interpretation: string | null;
  signal: string | null;
  speculation: string | null;
  whyItMatters: string;
  outlook: string;
  businessOpportunity: string | null;
  originalContent: OriginalContentDto;
  topics: string[];
  entities: string[];
  heroImageUrl: string | null;
  heroImageAttribution: string | null;
  sources: SourceDto[];
}

export type EventRouteDto =
  | { kind: "event"; event: EventDto }
  | { kind: "redirect"; slug: string };

export interface OpportunityDto {
  id: string;
  name: string;
  score: number;
  stars: number;
  potential: string;
  customer: string;
  problem: string;
  differentiation: string;
  mvp: string;
  difficulty: string;
  monetization: string;
  falsification: string;
}

export interface ResourceDto {
  id: string;
  type: string;
  title: string;
  url: string;
  whyRelevant: string;
  stars: number | null;
}

export interface TrendSignalDto {
  id: string;
  label: string;
  summary: string;
  mood: string | null;
  sourceUrl: string | null;
}

export interface BriefingDto {
  dateKst: string;
  generatedAt: string;
  status: "complete" | "partial";
  todaysInsight: string;
  warnings: string[];
  events: EventDto[];
  opportunities: OpportunityDto[];
  resources: ResourceDto[];
  trends: TrendSignalDto[];
}

export interface TrendMetricDto { label: string; count: number; change: number; }
export interface TrendOverviewDto {
  window: 7 | 30;
  from: string;
  to: string;
  topics: TrendMetricDto[];
  entities: TrendMetricDto[];
  signals: TrendSignalDto[];
}
