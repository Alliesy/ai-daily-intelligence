import "server-only";

import { cache } from "react";
import { getArchiveEvent, getArchiveEventSlugs, getLatestArchiveBriefing } from "./archive";
import { getLatestSupabaseBriefing, getSupabaseEvent } from "./supabase";

function shouldUseSupabase() {
  const mode = process.env.CONTENT_SOURCE;
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (mode === "supabase" && (!hasUrl || !hasKey)) throw new Error("CONTENT_SOURCE=supabase에는 공개 Supabase 환경 변수가 필요합니다.");
  if (hasUrl !== hasKey) throw new Error("Supabase 공개 환경 변수는 URL과 key를 함께 설정해야 합니다.");
  return mode === "supabase" || (mode !== "archive" && hasUrl && hasKey);
}

export const getLatestBriefing = cache(async () => shouldUseSupabase() ? getLatestSupabaseBriefing() : getLatestArchiveBriefing());
export const getEvent = cache(async (slug: string) => shouldUseSupabase() ? getSupabaseEvent(slug) : getArchiveEvent(slug));
export async function getEventSlugs() { return shouldUseSupabase() ? [] : getArchiveEventSlugs(); }

export type { BriefingDto, EventDto, OpportunityDto, ResourceDto, SourceDto, TrendSignalDto } from "./types";
