import "server-only";

import { cache } from "react";
import { getArchiveBriefingByDate, getArchiveBriefingSummaries, getArchiveEvent, getArchiveEventSlugs, getArchiveTrendOverview, getLatestArchiveBriefing, searchArchiveBriefings } from "./archive";
import { getLatestSupabaseBriefing, getSupabaseBriefingByDate, getSupabaseBriefingSummaries, getSupabaseEventRoute, getSupabaseEventSlugs, getSupabaseTrendOverview, searchSupabaseBriefings } from "./supabase";

function shouldUseSupabase() {
  const mode = process.env.CONTENT_SOURCE;
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (mode === "supabase" && (!hasUrl || !hasKey)) throw new Error("CONTENT_SOURCE=supabase에는 공개 Supabase 환경 변수가 필요합니다.");
  if (hasUrl !== hasKey) throw new Error("Supabase 공개 환경 변수는 URL과 key를 함께 설정해야 합니다.");
  return mode === "supabase" || (mode !== "archive" && hasUrl && hasKey);
}

export const getLatestBriefing = cache(async () => shouldUseSupabase() ? getLatestSupabaseBriefing() : getLatestArchiveBriefing());
export const getBriefingByDate = cache(async (dateKst: string) => shouldUseSupabase() ? getSupabaseBriefingByDate(dateKst) : getArchiveBriefingByDate(dateKst));
export const getBriefingSummaries = cache(async () => shouldUseSupabase() ? getSupabaseBriefingSummaries() : getArchiveBriefingSummaries());
export const searchBriefings = cache(async (query: string) => shouldUseSupabase() ? searchSupabaseBriefings(query) : searchArchiveBriefings(query));
export const getEventRoute = cache(async (slug: string, dateKst?: string) => {
  if (shouldUseSupabase()) return getSupabaseEventRoute(slug, dateKst);
  const event = await getArchiveEvent(slug, dateKst);
  return event ? { kind: "event" as const, event } : null;
});
export async function getEventSlugs() { return shouldUseSupabase() ? getSupabaseEventSlugs() : getArchiveEventSlugs(); }
export const getTrendOverview = cache(async (window: 7 | 30) => shouldUseSupabase() ? getSupabaseTrendOverview(window) : getArchiveTrendOverview(window));

export type { BriefingDto, BriefingSummaryDto, EventDto, EventRouteDto, MorningPaperDto, OpportunityDto, OriginalContentDto, ResourceDto, SourceDto, TrendMetricDto, TrendOverviewDto, TrendSignalDto } from "./types";
