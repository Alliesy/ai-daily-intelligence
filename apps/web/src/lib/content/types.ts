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
  evidenceGroup: string | null;
}

export interface OriginalContentDto {
  mode: "translation" | "detailed_summary" | "unavailable";
  label: string;
  sections: { title: string; body: string }[];
}

export interface EventDto {
  id: string;
  eventKey: string;
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
  problemEvidence: Array<{ url: string; sourceType: string; summary: string; evidenceGroup: string | null }>;
  realismGates: Record<string, { status: "pass" | "fail" | "unknown"; evidence: string }>;
  todayEligible: boolean;
  eligibilityMethod: string | null;
  isBuildCandidate: boolean;
}

export interface MorningPaperDto {
  insightHeadline: string;
  insightSummary: string;
  insightMethod: string | null;
  evidenceEventKeys: string[];
  topEventKeys: string[];
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
  morningPaper: MorningPaperDto | null;
  warnings: string[];
  events: EventDto[];
  opportunities: OpportunityDto[];
  resources: ResourceDto[];
  trends: TrendSignalDto[];
}

export interface BriefingSummaryDto {
  dateKst: string;
  status: "complete" | "partial";
  headline: string;
  eventCount: number;
  sourceCount: number;
  officialSourceCount: number;
  titles: string[];
  topics: string[];
  entities: string[];
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
