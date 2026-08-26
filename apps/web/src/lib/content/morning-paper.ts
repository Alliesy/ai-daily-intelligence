import type { BriefingDto, EventDto, OpportunityDto } from "./types";

const importanceRank = { S: 0, A: 1, B: 2 } as const;

function uniqueEvents(events: EventDto[]) {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = event.id || event.eventKey;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function splitLegacyInsight(value: string) {
  const text = value.trim();
  if (!text) return { headline: "오늘의 핵심 변화를 준비하고 있습니다.", summary: "" };
  const sentences = text.match(/[^.!?]+[.!?]?/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [text];
  return { headline: sentences[0] ?? text, summary: sentences.slice(1, 4).join(" ") };
}

function selectByKeys(events: EventDto[], keys: string[]) {
  const byKey = new Map(events.flatMap((event) => [[event.eventKey, event], [event.id, event]]));
  return keys.flatMap((key) => {
    const event = byKey.get(key);
    return event ? [event] : [];
  });
}

export function selectTopEvents(briefing: BriefingDto, limit = 3) {
  const events = uniqueEvents(briefing.events);
  const explicit = selectByKeys(events, briefing.morningPaper?.topEventKeys ?? []);
  if (explicit.length) return explicit.slice(0, limit);
  return events
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => event.importance === "S" || event.importance === "A")
    .sort((left, right) => importanceRank[left.event.importance] - importanceRank[right.event.importance] || left.index - right.index)
    .slice(0, limit)
    .map(({ event }) => event);
}

export function selectTodayOpportunity(briefing: BriefingDto): OpportunityDto | null {
  return briefing.opportunities.find((opportunity) => opportunity.todayEligible) ?? null;
}

export function buildInsightEvidence(briefing: BriefingDto) {
  const events = uniqueEvents(briefing.events);
  const explicit = selectByKeys(events, briefing.morningPaper?.evidenceEventKeys ?? []);
  const evidenceEvents = explicit.length ? explicit : events;
  const sources = evidenceEvents.flatMap((event) => event.sources);
  const officialSourceIds = new Set(
    sources.filter((source) => source.authority === "official").map((source) => source.id),
  );
  const independentGroups = new Set(
    sources
      .filter((source) => source.authority === "independent" && source.evidenceGroup)
      .map((source) => source.evidenceGroup as string),
  );
  return {
    events: evidenceEvents,
    eventCount: evidenceEvents.length,
    officialSourceCount: officialSourceIds.size,
    independentSourceCount: independentGroups.size,
    hasIndependentClassification: independentGroups.size > 0,
  };
}

export function buildMorningPaper(briefing: BriefingDto) {
  const legacy = splitLegacyInsight(briefing.todaysInsight);
  return {
    headline: briefing.morningPaper?.insightHeadline.trim() || legacy.headline,
    summary: briefing.morningPaper?.insightSummary.trim() || legacy.summary,
    insightMethod: briefing.morningPaper?.insightMethod ?? null,
    evidence: buildInsightEvidence(briefing),
    topEvents: selectTopEvents(briefing),
    opportunity: selectTodayOpportunity(briefing),
  };
}

export function matchesBriefingKeyword(
  summary: { dateKst: string; headline: string; titles: string[]; topics: string[]; entities: string[] },
  query: string,
) {
  const needle = query.trim().toLocaleLowerCase("ko-KR");
  if (!needle) return true;
  return [summary.dateKst, summary.headline, ...summary.titles, ...summary.topics, ...summary.entities]
    .some((value) => value.toLocaleLowerCase("ko-KR").includes(needle));
}
