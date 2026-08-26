import { describe, expect, it } from "vitest";
import { buildOriginalContent, normalizeAnalysisFields, parseLabeledAnalysis } from "./presentation";

describe("content presentation", () => {
  it("splits labeled legacy analysis without carrying later sections forward", () => {
    const parsed = parseLabeledAnalysis("FACT: 사실. INTERPRETATION: 해석. SIGNAL: 신호. SPECULATION: 전망.");
    expect(parsed).toEqual({ fact: "사실.", interpretation: "해석.", signal: "신호.", speculation: "전망." });
  });

  it("repairs projection rows whose fact field contains every labeled section", () => {
    const normalized = normalizeAnalysisFields({
      fact: "FACT: Fact only. INTERPRETATION: Meaning. SIGNAL: Watch this. SPECULATION: Possible next step.",
      interpretation: "Meaning. SIGNAL: Watch this. SPECULATION: Possible next step.",
      signal: "Watch this. SPECULATION: Possible next step.",
      speculation: "Possible next step.",
    });
    expect(normalized).toEqual({ fact: "Fact only.", interpretation: "Meaning.", signal: "Watch this.", speculation: "Possible next step." });
  });

  it("preserves clean structured values when a legacy fact conflicts with them", () => {
    const normalized = normalizeAnalysisFields({
      fact: "FACT: Old fact. INTERPRETATION: Old meaning. SIGNAL: Old signal. SPECULATION: Old outlook.",
      interpretation: "New structured meaning explaining the UI label SIGNAL: without being a legacy suffix.",
      signal: "New structured signal with the prose fragment SIGNAL: retained.",
      speculation: "New structured outlook.",
    });
    expect(normalized).toEqual({
      fact: "Old fact.",
      interpretation: "New structured meaning explaining the UI label SIGNAL: without being a legacy suffix.",
      signal: "New structured signal with the prose fragment SIGNAL: retained.",
      speculation: "New structured outlook.",
    });
  });

  it("does not normalize partial, out-of-order, or repeated labels", () => {
    const samples = [
      "FACT: fact. SIGNAL: signal.",
      "FACT: fact. SIGNAL: signal. INTERPRETATION: meaning. SPECULATION: outlook.",
      "FACT: fact. INTERPRETATION: meaning. SIGNAL: first. SIGNAL: second. SPECULATION: outlook.",
    ];
    for (const fact of samples) {
      expect(normalizeAnalysisFields({ fact, interpretation: null, signal: null, speculation: null })).toEqual({
        fact,
        interpretation: null,
        signal: null,
        speculation: null,
      });
    }
  });

  it("keeps nullable structured fields unchanged without the known legacy shape", () => {
    expect(normalizeAnalysisFields({ fact: null, interpretation: "Analysis mentioning SIGNAL: as prose.", signal: null, speculation: null })).toEqual({
      fact: null,
      interpretation: "Analysis mentioning SIGNAL: as prose.",
      signal: null,
      speculation: null,
    });
  });

  it("builds a rights-safe detailed summary only from available fields", () => {
    expect(buildOriginalContent("사건 개요", "확인된 사실")).toEqual({
      mode: "detailed_summary",
      label: "원문 기반 상세 요약",
      sections: [{ title: "사건 개요", body: "사건 개요" }, { title: "확인된 발표·보도", body: "확인된 사실" }],
    });
    expect(buildOriginalContent("", null).mode).toBe("unavailable");
  });
});
