import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { buildReaderSections } from "./reader-content";

describe("V1.2 reader content projection", () => {
  test("keeps Researcher-authored reader copy byte-for-byte", () => {
    const whyItMatters = "처음에는 읽기와 요약부터 범위를 좁혀야 합니다.";
    const outlook = "한국 배포 시점과 권한 설정을 확인해야 합니다.";

    expect(buildReaderSections({ whyItMatters, outlook })).toEqual([
      { label: "왜 알아야 할까요?", body: whyItMatters },
      { label: "앞으로 볼 건", body: outlook },
    ]);
  });

  test("does not synthesize missing reader fields", () => {
    expect(buildReaderSections({ whyItMatters: "", outlook: "" })).toEqual([]);
  });

  test.each([
    ["제품", "업무 방식이 달라집니다.", "한국 출시를 확인합니다."],
    ["연구", "정확도와 비용을 함께 봐야 합니다.", "독립 재현을 기다립니다."],
    ["정책", "적용 대상과 시점이 중요합니다.", "시행 세칙을 확인합니다."],
  ])("preserves %s Event copy without category inference", (_kind, whyItMatters, outlook) => {
    expect(buildReaderSections({ whyItMatters, outlook }).map((section) => section.body)).toEqual([whyItMatters, outlook]);
  });

  test("ignores unapproved action, Event type and Source locale hints", () => {
    const unapproved = {
      whyItMatters: "확정된 문장",
      outlook: "확정된 전망",
      tryNow: "Web이 표시하면 안 되는 미승인 필드",
      eventType: "product",
      sourceLocale: "ko-KR",
    };
    expect(buildReaderSections(unapproved)).toEqual([
      { label: "왜 알아야 할까요?", body: "확정된 문장" },
      { label: "앞으로 볼 건", body: "확정된 전망" },
    ]);
  });

  test("accepts current and legacy archive copy as immutable input", () => {
    const current = JSON.parse(readFileSync(fileURLToPath(new URL("../../../../../data/daily/2026/2026-08-27.json", import.meta.url)), "utf8"));
    const legacy = JSON.parse(readFileSync(fileURLToPath(new URL("../../../../../data/daily/2026/2026-08-07.json", import.meta.url)), "utf8"));
    for (const item of [current.news[0], legacy.news[0]]) {
      expect(buildReaderSections({ whyItMatters: item.why_it_matters, outlook: item.outlook })).toEqual([
        { label: "왜 알아야 할까요?", body: item.why_it_matters },
        { label: "앞으로 볼 건", body: item.outlook },
      ]);
    }
  });
});
