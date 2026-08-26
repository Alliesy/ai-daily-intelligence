import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import type { BriefingDto, BriefingSummaryDto, EventDto, OpportunityDto, SourceDto, TrendMetricDto, TrendOverviewDto } from "./types";
import { buildOriginalContent, normalizeAnalysisFields, parseLabeledAnalysis } from "./presentation";
import { buildMorningPaper, matchesBriefingKeyword } from "./morning-paper";

type RecordValue = Record<string, unknown>;

async function findArchiveRoot() {
  const candidates = [
    path.resolve(process.cwd(), "data/daily"),
    path.resolve(process.cwd(), "../../data/daily"),
  ];
  for (const candidate of candidates) {
    try {
      if ((await fs.stat(/* turbopackIgnore: true */ candidate)).isDirectory()) return candidate;
    } catch {
      // Continue to the next repository layout candidate.
    }
  }
  throw new Error("Git daily archive를 찾을 수 없습니다.");
}

async function listPackets() {
  const root = await findArchiveRoot();
  const years = (await fs.readdir(/* turbopackIgnore: true */ root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^\d{4}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  const packets: string[] = [];
  for (const year of years) {
    const yearRoot = path.join(/* turbopackIgnore: true */ root, year);
    const files = (await fs.readdir(/* turbopackIgnore: true */ yearRoot))
      .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
      .sort();
    packets.push(...files.map((name) => path.join(/* turbopackIgnore: true */ yearRoot, name)));
  }
  return packets;
}

async function readPacket(file: string): Promise<RecordValue> {
  return JSON.parse(await fs.readFile(file, "utf8")) as RecordValue;
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function number(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function records(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.filter((item): item is RecordValue => Boolean(item) && typeof item === "object") : [];
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function record(value: unknown): RecordValue | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : null;
}

function youtubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    if (parsed.hostname.endsWith("youtube.com")) {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (["shorts", "embed", "live"].includes(parts[0] ?? "")) return parts[1] ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

function classifySource(url: string, publisher: string): Pick<SourceDto, "sourceType" | "authority" | "verificationStatus"> {
  let hostname = "";
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return { sourceType: "other", authority: "unknown", verificationStatus: "unverified" };
  }
  if (hostname === "youtu.be" || hostname.endsWith("youtube.com")) {
    return { sourceType: "youtube", authority: "unknown", verificationStatus: "unverified" };
  }
  if (hostname === "x.com" || hostname === "twitter.com") {
    return { sourceType: "x", authority: "unknown", verificationStatus: "unverified" };
  }
  if (hostname === "github.com") {
    return { sourceType: "github", authority: "unknown", verificationStatus: "unverified" };
  }
  if (hostname === "arxiv.org") {
    return { sourceType: "paper", authority: "primary", verificationStatus: "unverified" };
  }
  if (hostname === "ai.meta.com") {
    return { sourceType: "official_blog", authority: "official", verificationStatus: "unverified" };
  }
  if (hostname.endsWith("europa.eu")) {
    return { sourceType: "documentation", authority: "official", verificationStatus: "unverified" };
  }
  if (["apnews.com", "www.wired.com", "www.businessinsider.com"].includes(hostname)) {
    return { sourceType: "article", authority: "independent", verificationStatus: "unverified" };
  }
  if (/reddit/i.test(publisher) || hostname.endsWith("reddit.com")) {
    return { sourceType: "reddit", authority: "community", verificationStatus: "unverified" };
  }
  return { sourceType: "other", authority: "unknown", verificationStatus: "unverified" };
}

function mapSource(source: RecordValue, originalUrl: string, index: number): SourceDto {
  const url = text(source.url);
  const publisher = text(source.publisher, "출처 미상");
  const fallback = classifySource(url, publisher);
  const classification = {
    sourceType: text(source.source_type, fallback.sourceType) as SourceDto["sourceType"],
    authority: text(source.authority, fallback.authority) as SourceDto["authority"],
    verificationStatus: text(source.verification_status, fallback.verificationStatus) as SourceDto["verificationStatus"],
  };
  const videoId = youtubeId(url);
  return {
    id: `${url || publisher}-${index}`,
    title: text(source.title, publisher),
    publisher,
    url,
    ...classification,
    publishedAt: text(source.published_at) || null,
    thumbnailUrl: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null,
    isPrimary: url === originalUrl,
    evidenceGroup: text(source.evidence_group) || null,
  };
}

function mapEvent(item: RecordValue): EventDto {
  const summaryRaw = text(item.summary);
  const parsed = parseLabeledAnalysis(summaryRaw);
  const analysis = normalizeAnalysisFields({ fact: parsed.fact ?? (summaryRaw || null), interpretation: parsed.interpretation ?? null, signal: parsed.signal ?? null, speculation: parsed.speculation ?? null });
  const originalUrl = text(item.original_url);
  const sources = records(item.sources).map((source, index) => mapSource(source, originalUrl, index));
  return {
    id: text(item.event_key),
    eventKey: text(item.event_key),
    slug: text(item.event_key),
    title: text(item.title, "제목 없음"),
    oneLineSummary: text(item.one_line_summary),
    importance: ["S", "A", "B"].includes(text(item.importance)) ? (item.importance as "S" | "A" | "B") : "B",
    impact: text(item.impact),
    fact: analysis.fact,
    interpretation: analysis.interpretation,
    signal: analysis.signal,
    speculation: analysis.speculation,
    whyItMatters: text(item.why_it_matters),
    outlook: text(item.outlook),
    businessOpportunity: text(item.business_opportunity) || null,
    originalContent: buildOriginalContent(text(item.one_line_summary), analysis.fact),
    topics: strings(item.tags),
    entities: [],
    heroImageUrl: null,
    heroImageAttribution: null,
    sources,
  };
}

function mapOpportunity(item: RecordValue, packet: RecordValue, index: number): OpportunityDto {
  const candidate = record(packet.build_candidate);
  const gates = record(item.realism_gates) ?? {};
  return {
    id: `${text(packet.date_kst)}-${index}`,
    name: text(item.name),
    score: number(item.score),
    stars: number(item.stars),
    potential: text(item.potential),
    customer: text(item.customer),
    problem: text(item.problem),
    differentiation: text(item.differentiation),
    mvp: text(item.mvp_2_weeks),
    difficulty: text(item.difficulty),
    monetization: text(item.monetization),
    falsification: text(item.falsification),
    problemEvidence: records(item.problem_evidence).map((evidence) => ({
      url: text(evidence.url), sourceType: text(evidence.source_type, "other"),
      summary: text(evidence.summary), evidenceGroup: text(evidence.evidence_group) || null,
    })),
    realismGates: Object.fromEntries(Object.entries(gates).flatMap(([key, value]) => {
      const gate = record(value);
      return gate ? [[key, { status: text(gate.status, "unknown") as "pass" | "fail" | "unknown", evidence: text(gate.evidence) }]] : [];
    })),
    todayEligible: item.today_eligible === true,
    eligibilityMethod: text(item.eligibility_method) || null,
    isBuildCandidate: candidate?.idea_name === item.name,
  };
}

function mapPacket(packet: RecordValue): BriefingDto {
  const morning = record(packet.morning_paper);
  return {
    dateKst: text(packet.date_kst),
    generatedAt: text(packet.generated_at),
    status: packet.status === "partial" ? "partial" : "complete",
    todaysInsight: text(packet.todays_insight),
    morningPaper: morning ? {
      insightHeadline: text(morning.insight_headline),
      insightSummary: text(morning.insight_summary),
      insightMethod: text(morning.insight_method) || null,
      evidenceEventKeys: strings(morning.evidence_event_keys),
      topEventKeys: strings(morning.top_event_keys),
    } : null,
    warnings: strings(packet.warnings),
    events: records(packet.news).map(mapEvent),
    opportunities: records(packet.business_ideas).map((item, index) => mapOpportunity(item, packet, index)),
    resources: [...records(packet.tools), ...records(packet.worth_reading)].map((item, index) => ({
      id: `${text(item.url)}-${index}`,
      type: text(item.type, "Tool"),
      title: text(item.name, text(item.title)),
      url: text(item.url),
      whyRelevant: text(item.why_trending, text(item.why_read, text(item.worth_trying))),
      stars: typeof item.stars === "number" ? item.stars : null,
    })),
    trends: records(packet.community).map((item, index) => ({
      id: `${text(item.platform)}-${index}`,
      label: text(item.platform, "Community"),
      summary: text(item.one_line_summary),
      mood: text(item.mood) || null,
      sourceUrl: text(item.url) || null,
    })),
  };
}

export async function getLatestArchiveBriefing() {
  const files = await listPackets();
  const latest = files.at(-1);
  if (!latest) return null;
  return mapPacket(await readPacket(latest));
}

export async function getArchiveBriefingByDate(dateKst: string) {
  const files = await listPackets();
  const file = files.find((candidate) => path.basename(candidate, ".json") === dateKst);
  return file ? mapPacket(await readPacket(file)) : null;
}

export async function getArchiveBriefingSummaries(): Promise<BriefingSummaryDto[]> {
  const summaries: BriefingSummaryDto[] = [];
  for (const file of (await listPackets()).reverse()) {
    const briefing = mapPacket(await readPacket(file));
    const paper = buildMorningPaper(briefing);
    summaries.push({
      dateKst: briefing.dateKst,
      status: briefing.status,
      headline: paper.headline,
      eventCount: paper.evidence.eventCount,
      sourceCount: paper.evidence.events.flatMap((event) => event.sources).length,
      officialSourceCount: paper.evidence.officialSourceCount,
      titles: briefing.events.map((event) => event.title),
      topics: [...new Set(briefing.events.flatMap((event) => event.topics))],
      entities: [...new Set(briefing.events.flatMap((event) => event.entities))],
    });
  }
  return summaries;
}

export async function searchArchiveBriefings(query: string) {
  return (await getArchiveBriefingSummaries()).filter((summary) => matchesBriefingKeyword(summary, query));
}

export async function getArchiveEvent(slug: string) {
  const files = (await listPackets()).reverse();
  for (const file of files) {
    const packet = mapPacket(await readPacket(file));
    const event = packet.events.find((item) => item.slug === slug || item.id === slug);
    if (event) return event;
  }
  return null;
}

export async function getArchiveEventSlugs() {
  const result = new Set<string>();
  for (const file of await listPackets()) {
    for (const event of mapPacket(await readPacket(file)).events) result.add(event.slug);
  }
  return [...result];
}

function metric(rows: { date: string; labels: string[] }[], midpoint: string): TrendMetricDto[] {
  const totals = new Map<string, { previous: number; recent: number }>();
  for (const row of rows) for (const label of new Set(row.labels)) {
    const value = totals.get(label) ?? { previous: 0, recent: 0 };
    if (row.date >= midpoint) value.recent += 1; else value.previous += 1;
    totals.set(label, value);
  }
  return [...totals.entries()].map(([label, value]) => ({ label, count: value.previous + value.recent, change: value.recent - value.previous })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 12);
}

export async function getArchiveTrendOverview(window: 7 | 30): Promise<TrendOverviewDto | null> {
  const files = await listPackets();
  if (!files.length) return null;
  const briefings = await Promise.all(files.map(async (file) => mapPacket(await readPacket(file))));
  const to = briefings.at(-1)!.dateKst;
  const fromDate = new Date(`${to}T00:00:00Z`); fromDate.setUTCDate(fromDate.getUTCDate() - window + 1);
  const from = fromDate.toISOString().slice(0, 10);
  const midpointDate = new Date(fromDate); midpointDate.setUTCDate(midpointDate.getUTCDate() + Math.floor(window / 2));
  const midpoint = midpointDate.toISOString().slice(0, 10);
  const selected = briefings.filter((briefing) => briefing.dateKst >= from && briefing.dateKst <= to);
  const rows = selected.flatMap((briefing) => briefing.events.map((event) => ({ date: briefing.dateKst, topics: event.topics, entities: event.entities })));
  return { window, from, to, topics: metric(rows.map((row) => ({ date: row.date, labels: row.topics })), midpoint), entities: metric(rows.map((row) => ({ date: row.date, labels: row.entities })), midpoint), signals: selected.flatMap((briefing) => briefing.trends).slice(-12).reverse() };
}
