import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { BriefingDto, EventDto, SourceDto } from "./types";

type Row = Record<string, unknown>;

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase 공개 환경 변수가 완전하지 않습니다.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? value as Row[] : [];
}

function str(value: unknown, fallback = "") { return typeof value === "string" ? value : fallback; }
function num(value: unknown, fallback = 0) { return typeof value === "number" ? value : fallback; }

async function hydrateEvents(briefingId: string, occurrenceRows: Row[]): Promise<EventDto[]> {
  const client = publicClient();
  const eventIds = occurrenceRows.map((row) => str(row.event_id));
  if (!eventIds.length) return [];
  const [{ data: events, error: eventError }, { data: sourceOccurrences, error: sourceError }] = await Promise.all([
    client.from("events").select("id,slug,title_original,title_ko,one_line_summary_ko,importance,hero_image_url,hero_image_attribution,event_analysis(*),event_topics(topics(name_ko)),event_entities(entities(canonical_name,display_name_ko))").in("id", eventIds),
    client.from("event_source_occurrences").select("event_id,source_id,verification_status,is_primary,display_order,sources(id,title,publisher,source_type,authority,published_at,thumbnail_url,source_urls(normalized_url,is_current_canonical))").eq("briefing_id", briefingId).order("display_order"),
  ]);
  if (eventError) throw eventError;
  if (sourceError) throw sourceError;
  const byId = new Map(asRows(events).map((row) => [str(row.id), row]));
  const sourceByEvent = new Map<string, SourceDto[]>();
  for (const occurrence of asRows(sourceOccurrences)) {
    const source = (occurrence.sources ?? {}) as Row;
    const urls = asRows(source.source_urls);
    const canonical = urls.find((url) => url.is_current_canonical === true) ?? urls[0];
    const mapped: SourceDto = {
      id: str(source.id), title: str(source.title), publisher: str(source.publisher),
      url: str(canonical?.normalized_url), sourceType: str(source.source_type, "other") as SourceDto["sourceType"],
      authority: str(source.authority, "unknown") as SourceDto["authority"],
      verificationStatus: str(occurrence.verification_status, "unverified") as SourceDto["verificationStatus"],
      publishedAt: str(source.published_at) || null, thumbnailUrl: str(source.thumbnail_url) || null,
      isPrimary: occurrence.is_primary === true,
    };
    const key = str(occurrence.event_id);
    sourceByEvent.set(key, [...(sourceByEvent.get(key) ?? []), mapped]);
  }
  return occurrenceRows.sort((a, b) => num(a.display_order) - num(b.display_order)).flatMap((occurrence) => {
    const event = byId.get(str(occurrence.event_id));
    if (!event) return [];
    const analyses = asRows(event.event_analysis).sort((a, b) => str(b.analysis_date).localeCompare(str(a.analysis_date)));
    const selected = analyses.find((analysis) => analysis.id === occurrence.analysis_id) ?? analyses.find((analysis) => analysis.is_current === true) ?? analyses[0] ?? {};
    return [{
      id: str(event.id), slug: str(event.slug), title: str(occurrence.title_ko, str(event.title_ko, str(occurrence.title_original, str(event.title_original)))),
      oneLineSummary: str(occurrence.one_line_summary_ko, str(event.one_line_summary_ko)),
      importance: str(occurrence.importance, str(event.importance, "B")) as EventDto["importance"],
      impact: str(selected.impact), fact: str(selected.fact) || null, interpretation: str(selected.interpretation) || null,
      signal: str(selected.signal) || null, speculation: str(selected.speculation) || null,
      whyItMatters: str(selected.why_it_matters), outlook: str(selected.outlook), businessOpportunity: str(selected.business_opportunity) || null,
      topics: asRows(event.event_topics).map((link) => str((link.topics as Row | undefined)?.name_ko)).filter(Boolean),
      entities: asRows(event.event_entities).map((link) => { const entity = link.entities as Row | undefined; return str(entity?.display_name_ko, str(entity?.canonical_name)); }).filter(Boolean),
      heroImageUrl: str(event.hero_image_url) || null, heroImageAttribution: str(event.hero_image_attribution) || null,
      sources: sourceByEvent.get(str(event.id)) ?? [],
    } satisfies EventDto];
  });
}

export async function getLatestSupabaseBriefing(): Promise<BriefingDto | null> {
  const client = publicClient();
  const { data: briefing, error } = await client.from("daily_briefings")
    .select("id,date_kst,generated_at,status,todays_insight,warnings")
    .order("date_kst", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  if (!briefing) return null;
  const briefingId = str(briefing.id);
  const [{ data: occurrences, error: occurrenceError }, { data: opportunities, error: opportunityError }, { data: resources, error: resourceError }, { data: trends, error: trendError }] = await Promise.all([
    client.from("daily_briefing_events").select("*").eq("briefing_id", briefingId).order("display_order"),
    client.from("daily_briefing_opportunities").select("*").eq("briefing_id", briefingId).order("display_order"),
    client.from("daily_briefing_resources").select("section,display_order,resources(*)").eq("briefing_id", briefingId).order("display_order"),
    client.from("trend_signals").select("*").eq("briefing_id", briefingId).order("display_order"),
  ]);
  if (occurrenceError || opportunityError || resourceError || trendError) throw occurrenceError ?? opportunityError ?? resourceError ?? trendError;
  return {
    dateKst: str(briefing.date_kst), generatedAt: str(briefing.generated_at), status: briefing.status === "partial" ? "partial" : "complete",
    todaysInsight: str(briefing.todays_insight), warnings: Array.isArray(briefing.warnings) ? briefing.warnings.filter((v): v is string => typeof v === "string") : [],
    events: await hydrateEvents(briefingId, asRows(occurrences)),
    opportunities: asRows(opportunities).map((row) => ({ id: str(row.opportunity_id), name: str(row.name), score: num(row.score), stars: num(row.stars), potential: str(row.potential), customer: str(row.customer), problem: str(row.problem), differentiation: str(row.differentiation), mvp: str(row.mvp_2_weeks), difficulty: str(row.difficulty), monetization: str(row.monetization), falsification: str(row.falsification) })),
    resources: asRows(resources).map((link) => { const row = link.resources as Row; return { id: str(row.id), type: str(row.resource_type), title: str(row.title), url: str(row.url), whyRelevant: str(row.why_relevant), stars: typeof row.stars === "number" ? row.stars : null }; }),
    trends: asRows(trends).map((row) => ({ id: str(row.id), label: str(row.label), summary: str(row.summary), mood: str(row.mood) || null, sourceUrl: str(row.source_url) || null })),
  };
}

export async function getSupabaseEvent(slug: string): Promise<EventDto | null> {
  const client = publicClient();
  const { data: event, error } = await client.from("events").select("id").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!event) return null;
  const { data: occurrence, error: occurrenceError } = await client.from("daily_briefing_events").select("*").eq("event_id", event.id).order("source_revision", { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
  if (occurrenceError) throw occurrenceError;
  if (!occurrence) return null;
  return (await hydrateEvents(str(occurrence.briefing_id), [occurrence as Row]))[0] ?? null;
}

