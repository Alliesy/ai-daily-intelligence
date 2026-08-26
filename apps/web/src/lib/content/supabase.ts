import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { BriefingDto, BriefingSummaryDto, EventDto, EventRouteDto, OpportunityDto, SourceDto, TrendMetricDto, TrendOverviewDto } from "./types";
import { mergeRedirectSlug, selectLatestOccurrence, selectLatestSourceOccurrences } from "./selection";
import { buildOriginalContent, normalizeAnalysisFields } from "./presentation";
import { matchesBriefingKeyword, splitLegacyInsight } from "./morning-paper";

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
function obj(value: unknown): Row { return value && typeof value === "object" && !Array.isArray(value) ? value as Row : {}; }

async function hydrateEvents(briefingId: string, occurrenceRows: Row[], sourceScope: "briefing" | "event" = "briefing"): Promise<EventDto[]> {
  const client = publicClient();
  const eventIds = occurrenceRows.map((row) => str(row.event_id));
  if (!eventIds.length) return [];
  let sourceQuery = client.from("event_source_occurrences")
    .select("event_id,source_id,briefing_id,verification_status,is_primary,display_order,source_type_snapshot,authority_snapshot,evidence_group,event_sources!inner(sources(id,title,publisher,source_type,authority,published_at,thumbnail_url,source_urls(normalized_url,is_current_canonical)))")
    .in("event_id", eventIds);
  if (sourceScope === "briefing") sourceQuery = sourceQuery.eq("briefing_id", briefingId);
  const [{ data: events, error: eventError }, { data: sourceOccurrences, error: sourceError }] = await Promise.all([
    client.from("events").select("id,canonical_event_key,slug,title_original,title_ko,one_line_summary_ko,importance,hero_image_url,hero_image_attribution,event_analysis(*),event_topics(topics(name_ko)),event_entities(entities(canonical_name,display_name_ko))").in("id", eventIds),
    sourceQuery,
  ]);
  if (eventError) throw eventError;
  if (sourceError) throw sourceError;
  let sourceRows = asRows(sourceOccurrences);
  if (sourceScope === "event" && sourceRows.length) {
    const briefingIds = [...new Set(sourceRows.map((row) => str(row.briefing_id)).filter(Boolean))];
    const { data: sourceBriefings, error: sourceBriefingError } = await client.from("daily_briefings")
      .select("id,date_kst,source_revision").in("id", briefingIds);
    if (sourceBriefingError) throw sourceBriefingError;
    const briefingById = new Map(asRows(sourceBriefings).map((row) => [str(row.id), row]));
    sourceRows = sourceRows.map((row) => ({ ...row, daily_briefings: briefingById.get(str(row.briefing_id)) ?? {} }));
  }
  const byId = new Map(asRows(events).map((row) => [str(row.id), row]));
  const sourceByEvent = new Map<string, SourceDto[]>();
  const selectedSourceOccurrences = sourceScope === "event"
    ? selectLatestSourceOccurrences(sourceRows)
    : sourceRows.sort((a, b) => num(a.display_order) - num(b.display_order));
  for (const occurrence of selectedSourceOccurrences) {
    const eventSource = (occurrence.event_sources ?? {}) as Row;
    const source = (eventSource.sources ?? {}) as Row;
    const urls = asRows(source.source_urls);
    const canonical = urls.find((url) => url.is_current_canonical === true) ?? urls[0];
    const mapped: SourceDto = {
      id: str(source.id), title: str(source.title), publisher: str(source.publisher),
      url: str(canonical?.normalized_url), sourceType: str(occurrence.source_type_snapshot, str(source.source_type, "other")) as SourceDto["sourceType"],
      authority: str(occurrence.authority_snapshot, str(source.authority, "unknown")) as SourceDto["authority"],
      verificationStatus: str(occurrence.verification_status, "unverified") as SourceDto["verificationStatus"],
      publishedAt: str(source.published_at) || null, thumbnailUrl: str(source.thumbnail_url) || null,
      isPrimary: occurrence.is_primary === true,
      evidenceGroup: str(occurrence.evidence_group) || null,
    };
    const key = str(occurrence.event_id);
    sourceByEvent.set(key, [...(sourceByEvent.get(key) ?? []), mapped]);
  }
  return occurrenceRows.sort((a, b) => num(a.display_order) - num(b.display_order)).flatMap((occurrence) => {
    const event = byId.get(str(occurrence.event_id));
    if (!event) return [];
    const analyses = asRows(event.event_analysis).sort((a, b) => str(b.analysis_date).localeCompare(str(a.analysis_date)));
    const selected = analyses.find((analysis) => analysis.id === occurrence.analysis_id) ?? analyses.find((analysis) => analysis.is_current === true) ?? analyses[0] ?? {};
    const analysis = normalizeAnalysisFields({ fact: str(selected.fact) || null, interpretation: str(selected.interpretation) || null, signal: str(selected.signal) || null, speculation: str(selected.speculation) || null });
    const title = str(occurrence.title_ko, str(event.title_ko, str(occurrence.title_original, str(event.title_original))));
    const oneLineSummary = str(occurrence.one_line_summary_ko, str(event.one_line_summary_ko));
    return [{
      id: str(event.id), eventKey: str(event.canonical_event_key, str(event.slug)), slug: str(event.slug), title,
      oneLineSummary,
      importance: str(occurrence.importance, str(event.importance, "B")) as EventDto["importance"],
      impact: str(selected.impact), fact: analysis.fact, interpretation: analysis.interpretation,
      signal: analysis.signal, speculation: analysis.speculation,
      whyItMatters: str(selected.why_it_matters), outlook: str(selected.outlook), businessOpportunity: str(selected.business_opportunity) || null,
      originalContent: buildOriginalContent(oneLineSummary, analysis.fact),
      topics: asRows(event.event_topics).map((link) => str((link.topics as Row | undefined)?.name_ko)).filter(Boolean),
      entities: asRows(event.event_entities).map((link) => { const entity = link.entities as Row | undefined; return str(entity?.display_name_ko, str(entity?.canonical_name)); }).filter(Boolean),
      heroImageUrl: str(occurrence.hero_image_url, str(event.hero_image_url)) || null,
      heroImageAttribution: str(occurrence.hero_image_attribution, str(event.hero_image_attribution)) || null,
      sources: sourceByEvent.get(str(event.id)) ?? [],
    } satisfies EventDto];
  });
}

function mapOpportunityOccurrence(row: Row): OpportunityDto {
  const gates = obj(row.realism_gates);
  return {
    id: str(row.opportunity_id), name: str(row.name), score: num(row.score), stars: num(row.stars),
    potential: str(row.potential), customer: str(row.customer), problem: str(row.problem),
    differentiation: str(row.differentiation), mvp: str(row.mvp_2_weeks), difficulty: str(row.difficulty),
    monetization: str(row.monetization), falsification: str(row.falsification),
    problemEvidence: asRows(row.problem_evidence).map((evidence) => ({
      url: str(evidence.url), sourceType: str(evidence.source_type, "other"), summary: str(evidence.summary),
      evidenceGroup: str(evidence.evidence_group) || null,
    })),
    realismGates: Object.fromEntries(Object.entries(gates).flatMap(([key, value]) => {
      const gate = obj(value);
      return Object.keys(gate).length ? [[key, { status: str(gate.status, "unknown") as "pass" | "fail" | "unknown", evidence: str(gate.evidence) }]] : [];
    })),
    todayEligible: row.today_eligible === true,
    eligibilityMethod: str(row.eligibility_method) || null,
    isBuildCandidate: str(row.candidate_status) === "waiting_for_owner",
  } satisfies OpportunityDto;
}

async function getSupabaseBriefing(dateKst?: string): Promise<BriefingDto | null> {
  const client = publicClient();
  let briefingQuery = client.from("daily_briefings")
    .select("id,date_kst,generated_at,status,todays_insight,warnings,insight_headline,insight_summary,insight_method")
    .eq("publication_state", "published");
  briefingQuery = dateKst
    ? briefingQuery.eq("date_kst", dateKst)
    : briefingQuery.order("date_kst", { ascending: false }).limit(1);
  const { data: briefing, error } = await briefingQuery.maybeSingle();
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
  const result: BriefingDto = {
    dateKst: str(briefing.date_kst), generatedAt: str(briefing.generated_at), status: briefing.status === "partial" ? "partial" : "complete",
    todaysInsight: str(briefing.todays_insight), warnings: Array.isArray(briefing.warnings) ? briefing.warnings.filter((v): v is string => typeof v === "string") : [],
    events: await hydrateEvents(briefingId, asRows(occurrences)),
    morningPaper: null,
    opportunities: asRows(opportunities).map(mapOpportunityOccurrence),
    resources: asRows(resources).map((link) => { const row = link.resources as Row; return { id: str(row.id), type: str(row.resource_type), title: str(row.title), url: str(row.url), whyRelevant: str(row.why_relevant), stars: typeof row.stars === "number" ? row.stars : null }; }),
    trends: asRows(trends).map((row) => ({ id: str(row.id), label: str(row.label), summary: str(row.summary), mood: str(row.mood) || null, sourceUrl: str(row.source_url) || null })),
  };

  const occurrenceRows = asRows(occurrences);
  const eventKeyById = new Map(result.events.map((event) => [event.id, event.eventKey]));
  const orderedKeys = (field: "insight_evidence_order" | "top_event_order") => occurrenceRows
    .filter((row) => typeof row[field] === "number")
    .sort((left, right) => num(left[field]) - num(right[field]))
    .map((row) => eventKeyById.get(str(row.event_id)))
    .filter((key): key is string => Boolean(key));
  const evidenceEventKeys = orderedKeys("insight_evidence_order");
  const topEventKeys = orderedKeys("top_event_order");
  if (str(briefing.insight_headline) || evidenceEventKeys.length || topEventKeys.length) {
    result.morningPaper = {
      insightHeadline: str(briefing.insight_headline), insightSummary: str(briefing.insight_summary),
      insightMethod: str(briefing.insight_method) || null, evidenceEventKeys, topEventKeys,
    };
  }
  return result;
}

export async function getLatestSupabaseBriefing() { return getSupabaseBriefing(); }
export async function getSupabaseBriefingByDate(dateKst: string) { return getSupabaseBriefing(dateKst); }

export async function getSupabaseBriefingSummaries(): Promise<BriefingSummaryDto[]> {
  const client = publicClient();
  const { data, error } = await client.from("daily_briefings")
    .select("id,date_kst,status,insight_headline,todays_insight").eq("publication_state", "published").order("date_kst", { ascending: false });
  if (error) throw error;
  const briefingRows = asRows(data);
  const briefingIds = briefingRows.map((row) => str(row.id));
  if (!briefingIds.length) return [];
  const [{ data: occurrences, error: occurrenceError }, { data: sourceOccurrences, error: sourceError }] = await Promise.all([
    client.from("daily_briefing_events")
      .select("briefing_id,event_id,title_ko,title_original,insight_evidence_order,events(title_ko,title_original,event_topics(topics(name_ko)),event_entities(entities(canonical_name,display_name_ko)))")
      .in("briefing_id", briefingIds),
    client.from("event_source_occurrences")
      .select("briefing_id,event_id,source_id,authority_snapshot,event_sources!inner(sources(authority))")
      .in("briefing_id", briefingIds),
  ]);
  if (occurrenceError || sourceError) throw occurrenceError ?? sourceError;
  const eventRows = asRows(occurrences);
  const sourceRows = asRows(sourceOccurrences);
  return briefingRows.map((briefing) => {
    const id = str(briefing.id);
    const allEvents = eventRows.filter((row) => str(row.briefing_id) === id);
    const explicitEvidence = allEvents.filter((row) => typeof row.insight_evidence_order === "number");
    const evidenceEvents = explicitEvidence.length ? explicitEvidence : allEvents;
    const evidenceIds = new Set(evidenceEvents.map((row) => str(row.event_id)));
    const evidenceSources = sourceRows.filter((row) => str(row.briefing_id) === id && evidenceIds.has(str(row.event_id)));
    const eventDetails = allEvents.map((row) => obj(row.events));
    return {
      dateKst: str(briefing.date_kst),
      status: briefing.status === "partial" ? "partial" : "complete",
      headline: str(briefing.insight_headline) || splitLegacyInsight(str(briefing.todays_insight)).headline,
      eventCount: new Set(evidenceEvents.map((row) => str(row.event_id))).size,
      sourceCount: new Set(evidenceSources.map((row) => str(row.source_id))).size,
      officialSourceCount: new Set(evidenceSources.filter((row) => {
        const source = obj(obj(row.event_sources).sources);
        return str(row.authority_snapshot, str(source.authority)) === "official";
      }).map((row) => str(row.source_id))).size,
      titles: allEvents.map((row, index) => str(row.title_ko, str(eventDetails[index]?.title_ko, str(row.title_original, str(eventDetails[index]?.title_original))))).filter(Boolean),
      topics: [...new Set(eventDetails.flatMap((event) => asRows(event.event_topics).map((link) => str(obj(link.topics).name_ko)).filter(Boolean)))],
      entities: [...new Set(eventDetails.flatMap((event) => asRows(event.event_entities).map((link) => { const entity = obj(link.entities); return str(entity.display_name_ko, str(entity.canonical_name)); }).filter(Boolean)))],
    } satisfies BriefingSummaryDto;
  });
}

export async function searchSupabaseBriefings(query: string) {
  return (await getSupabaseBriefingSummaries()).filter((summary) => matchesBriefingKeyword(summary, query));
}

export async function getSupabaseEventRoute(slug: string): Promise<EventRouteDto | null> {
  const client = publicClient();
  const { data: event, error } = await client.from("events").select("id,merged_into_event_id").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!event) return null;
  if (event.merged_into_event_id) {
    const { data: target, error: targetError } = await client.from("events").select("id,slug").eq("id", event.merged_into_event_id).maybeSingle();
    if (targetError) throw targetError;
    const targetSlug = mergeRedirectSlug(event as Row, target as Row | null);
    return targetSlug ? { kind: "redirect", slug: targetSlug } : null;
  }
  const { data: occurrences, error: occurrenceError } = await client.from("daily_briefing_events")
    .select("*,daily_briefings!inner(date_kst,source_revision)").eq("event_id", event.id);
  if (occurrenceError) throw occurrenceError;
  const occurrence = selectLatestOccurrence(asRows(occurrences));
  if (!occurrence) return null;
  const hydrated = (await hydrateEvents(str(occurrence.briefing_id), [occurrence], "event"))[0] ?? null;
  return hydrated ? { kind: "event", event: hydrated } : null;
}

export async function getSupabaseEventSlugs() {
  const { data, error } = await publicClient().from("events").select("slug").eq("publication_state", "published").order("last_seen_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.slug as string);
}

function trendMetrics(rows: { date: string; labels: string[] }[], midpoint: string): TrendMetricDto[] {
  const values = new Map<string, { previous: number; recent: number }>();
  for (const row of rows) for (const label of new Set(row.labels)) {
    const value = values.get(label) ?? { previous: 0, recent: 0 };
    if (row.date >= midpoint) value.recent += 1; else value.previous += 1;
    values.set(label, value);
  }
  return [...values.entries()].map(([label, value]) => ({ label, count: value.previous + value.recent, change: value.recent - value.previous })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 12);
}

export async function getSupabaseTrendOverview(window: 7 | 30): Promise<TrendOverviewDto | null> {
  const client = publicClient();
  const { data: latest, error: latestError } = await client.from("daily_briefings").select("date_kst").order("date_kst", { ascending: false }).limit(1).maybeSingle();
  if (latestError) throw latestError;
  if (!latest) return null;
  const to = str(latest.date_kst);
  const fromDate = new Date(`${to}T00:00:00Z`); fromDate.setUTCDate(fromDate.getUTCDate() - window + 1);
  const from = fromDate.toISOString().slice(0, 10);
  const midpointDate = new Date(fromDate); midpointDate.setUTCDate(midpointDate.getUTCDate() + Math.floor(window / 2));
  const midpoint = midpointDate.toISOString().slice(0, 10);
  const { data: briefings, error: briefingError } = await client.from("daily_briefings").select("id,date_kst").gte("date_kst", from).lte("date_kst", to);
  if (briefingError) throw briefingError;
  const dateById = new Map(asRows(briefings).map((row) => [str(row.id), str(row.date_kst)]));
  const ids = [...dateById.keys()];
  if (!ids.length) return { window, from, to, topics: [], entities: [], signals: [] };
  const [{ data: occurrences, error: occurrenceError }, { data: signals, error: signalError }] = await Promise.all([
    client.from("daily_briefing_events").select("briefing_id,events(event_topics(topics(name_ko)),event_entities(entities(canonical_name,display_name_ko)))").in("briefing_id", ids),
    client.from("trend_signals").select("id,briefing_id,label,summary,mood,source_url,display_order").in("briefing_id", ids).order("display_order"),
  ]);
  if (occurrenceError || signalError) throw occurrenceError ?? signalError;
  const rows = asRows(occurrences).map((occurrence) => {
    const event = occurrence.events as Row;
    return { date: dateById.get(str(occurrence.briefing_id)) ?? from, topics: asRows(event.event_topics).map((link) => str((link.topics as Row)?.name_ko)).filter(Boolean), entities: asRows(event.event_entities).map((link) => { const entity = link.entities as Row; return str(entity?.display_name_ko, str(entity?.canonical_name)); }).filter(Boolean) };
  });
  return { window, from, to, topics: trendMetrics(rows.map((row) => ({ date: row.date, labels: row.topics })), midpoint), entities: trendMetrics(rows.map((row) => ({ date: row.date, labels: row.entities })), midpoint), signals: asRows(signals).reverse().slice(0, 12).map((row) => ({ id: str(row.id), label: str(row.label), summary: str(row.summary), mood: str(row.mood) || null, sourceUrl: str(row.source_url) || null })) };
}
