import { describe, expect, test } from "vitest";
import { buildInsightEvidence, buildMorningPaper, matchesBriefingKeyword, selectTodayOpportunity, selectTopEvents } from "./morning-paper";
import type { BriefingDto, EventDto, OpportunityDto } from "./types";

function event(id: string, importance: "S" | "A" | "B", sources: EventDto["sources"] = []): EventDto {
  return {
    id, eventKey: id, slug: id, title: `제목 ${id}`, oneLineSummary: "요약", importance,
    impact: "", fact: null, interpretation: null, signal: null, speculation: null,
    whyItMatters: "", outlook: "", businessOpportunity: null,
    originalContent: { mode: "unavailable", label: "", sections: [] }, topics: [], entities: [],
    heroImageUrl: null, heroImageAttribution: null, sources,
  };
}

function opportunity(id: string, eligible = false, candidate = false): OpportunityDto {
  return {
    id, name: id, score: 4.5, stars: 5, potential: "Very High", customer: "고객", problem: "문제",
    differentiation: "차별", mvp: "MVP", difficulty: "낮음", monetization: "구독", falsification: "중단",
    problemEvidence: [], realismGates: {}, todayEligible: eligible, eligibilityMethod: null, isBuildCandidate: candidate,
  };
}

function briefing(events: EventDto[], opportunities: OpportunityDto[] = []): BriefingDto {
  return {
    dateKst: "2026-08-26", generatedAt: "2026-08-26T07:00:00+09:00", status: "complete",
    todaysInsight: "첫 문장이 핵심이다. 두 번째 문장은 설명이다.", morningPaper: null,
    warnings: [], events, opportunities, resources: [], trends: [],
  };
}

describe("Morning Paper selection", () => {
  test("clusters duplicate Event identity and selects at most three strong Events", () => {
    const duplicate = event("same", "S");
    const value = briefing([duplicate, { ...duplicate }, event("a", "A"), event("b", "B"), event("c", "S")]);
    expect(selectTopEvents(value).map((item) => item.id)).toEqual(["same", "c", "a"]);
    expect(buildInsightEvidence(value).eventCount).toBe(4);
  });

  test("uses explicit evidence groups without counting reprints twice", () => {
    const common = { title: "", publisher: "Reuters", url: "https://example.com", sourceType: "article" as const, authority: "independent" as const, verificationStatus: "corroborated" as const, publishedAt: null, thumbnailUrl: null, isPrimary: false, evidenceGroup: "wire-1" };
    const value = briefing([event("a", "S", [{ ...common, id: "s1" }, { ...common, id: "s2" }, { ...common, id: "official", authority: "official", evidenceGroup: null }])]);
    const evidence = buildInsightEvidence(value);
    expect(evidence.independentSourceCount).toBe(1);
    expect(evidence.officialSourceCount).toBe(1);
  });

  test("shows zero or one explicitly eligible opportunity", () => {
    expect(selectTodayOpportunity(briefing([], [opportunity("legacy", false, true)]))).toBeNull();
    expect(selectTodayOpportunity(briefing([], [opportunity("legacy", false, true), opportunity("eligible", true)]))?.id).toBe("eligible");
  });

  test("uses explicit Morning Paper text and key order", () => {
    const value = briefing([event("a", "A"), event("b", "S")]);
    value.morningPaper = { insightHeadline: "명시적 헤드라인", insightSummary: "명시적 설명", insightMethod: "cross_event_signal_v1", evidenceEventKeys: ["a"], topEventKeys: ["a"] };
    const paper = buildMorningPaper(value);
    expect(paper.headline).toBe("명시적 헤드라인");
    expect(paper.topEvents.map((item) => item.id)).toEqual(["a"]);
    expect(paper.evidence.eventCount).toBe(1);
  });

  test("matches date, Korean title, topic and entity keywords", () => {
    const summary = { dateKst: "2026-08-26", headline: "에이전트 운영 변화", titles: ["새 모델 공개"], topics: ["MCP"], entities: ["OpenAI"] };
    expect(matchesBriefingKeyword(summary, "에이전트")).toBe(true);
    expect(matchesBriefingKeyword(summary, "OpenAI")).toBe(true);
    expect(matchesBriefingKeyword(summary, "2026-08-26")).toBe(true);
    expect(matchesBriefingKeyword(summary, "로봇")).toBe(false);
  });
});
