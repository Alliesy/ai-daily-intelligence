import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { ReaderArticle } from "../../components/reader-article";
import { MorningPaper } from "../../components/morning-paper";
import EventDetailPage from "../../app/events/[slug]/page";
import type { BriefingDto, EventDto, ReaderContentDto } from "./types";

const state = vi.hoisted(() => ({ event: null as EventDto | null }));
vi.mock("@/lib/content", () => ({ getEventRoute: async () => ({ kind: "event", event: state.event }), getEventSlugs: async () => [] }));
vi.mock("@/components/event-actions", () => ({ EventActions: () => null }));
vi.mock("@/components/topic-follow", () => ({ TopicFollow: () => null }));
vi.mock("@/components/visitor-metadata", () => ({ VisitorMetadata: () => null }));
const reader: ReaderContentDto = { version: "1.3", headline: "새 제목", dek: "새 요약", body: "첫 문단.\n\n둘째 문단.", takeaway: null, whatToWatch: null, action: null };
const event: EventDto = {
  id: "event", eventKey: "event", slug: "event", reader, title: "옛 제목", oneLineSummary: "옛 요약",
  importance: "A", impact: "분석 평가", fact: "확인된 사실", interpretation: "해석 문장", signal: "신호 문장", speculation: "추정 문장",
  whyItMatters: "옛 의미", outlook: "옛 전망", businessOpportunity: "탈락한 기회 문장",
  originalContent: { mode: "detailed_summary", label: "원문", sections: [{ title: "사건 개요", body: "옛 요약" }, { title: "사실", body: "확인된 사실" }] },
  topics: [], entities: [], heroImageUrl: null, heroImageAttribution: null, sources: [],
};
const briefing: BriefingDto = { dateKst: "2026-09-23", generatedAt: "2026-09-23T07:00:00+09:00", status: "complete", todaysInsight: "인사이트 제목. 설명.", morningPaper: null, warnings: [], events: [event], opportunities: [], resources: [], trends: [] };

describe("actual Reader / Legacy markup", () => {
  test("all nullable section combinations render only supplied copy", () => {
    for (let mask = 0; mask < 8; mask++) {
      const copy = { ...reader, takeaway: mask & 1 ? "의미" : null, whatToWatch: mask & 2 ? "변수" : null, action: mask & 4 ? "행동" : null };
      const html = renderToStaticMarkup(createElement(ReaderArticle, { reader: copy }));
      expect(html.includes("하나만 기억한다면")).toBe(Boolean(mask & 1));
      expect(html.includes("앞으로 볼 건")).toBe(Boolean(mask & 2));
      expect(html.includes("지금 확인할 것")).toBe(Boolean(mask & 4));
      expect(html.match(/<p /g)).toHaveLength(2 + [1, 2, 4].filter((bit) => mask & bit).length);
      expect(html).not.toContain("rounded");
    }
  });
  test("detail puts all analysis behind a closed disclosure and never mounts OriginalContent", async () => {
    state.event = event;
    const html = renderToStaticMarkup(await EventDetailPage({ params: Promise.resolve({ slug: "event" }), searchParams: Promise.resolve({ date: "2026-09-23" }) }));
    const defaultFlow = html.replace(/<details\b[^>]*>[\s\S]*<\/details>/g, "");
    expect(defaultFlow).toContain("새 제목"); expect(defaultFlow).toContain("새 요약"); expect(defaultFlow).toContain("첫 문단.");
    for (const text of ["옛 제목", "옛 요약", "확인된 사실", "옛 의미", "옛 전망", "탈락한 기회 문장", "사건 개요"]) expect(defaultFlow).not.toContain(text);
    expect(html).toContain("AI 분석 더 보기");
    expect(html.match(/<details[^>]*>/)?.[0]).not.toContain("open=");
    expect(html).toContain("확인된 사실");
  });
  test("legacy still displays summary and fact exactly once on desktop, no duplicate original summary", async () => {
    state.event = { ...event, reader: null };
    const html = renderToStaticMarkup(await EventDetailPage({ params: Promise.resolve({ slug: "event" }), searchParams: Promise.resolve({}) }));
    expect(html.match(/옛 요약/g)).toHaveLength(1);
    // AnalysisCards has responsive desktop/mobile versions; one is CSS-hidden.
    expect(html.match(/확인된 사실/g)).toHaveLength(2);
    expect(html).not.toContain("사건 개요"); expect(html).not.toContain('data-reader-mode');
    expect(html).toContain("옛 의미");
  });
  test("Morning Paper uses only reader headline/dek and preserves dated archive links", () => {
    const html = renderToStaticMarkup(createElement(MorningPaper, { briefing, isArchive: true }));
    expect(html).toContain("새 제목"); expect(html).toContain("새 요약");
    for (const text of ["첫 문단.", "옛 요약", "옛 제목", "오늘의 기회", "Git archive 정본", "근거 Event"]) expect(html).not.toContain(text);
    expect(html).toContain('/events/event?date=2026-09-23');
    const legacy = renderToStaticMarkup(createElement(MorningPaper, { briefing: { ...briefing, events: [{ ...event, reader: null }] } }));
    expect(legacy).toContain("옛 제목"); expect(legacy).toContain("옛 요약");
  });
});
