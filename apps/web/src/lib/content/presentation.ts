import type { OriginalContentDto } from "./types";

const ANALYSIS_LABELS = ["FACT", "INTERPRETATION", "SIGNAL", "SPECULATION"] as const;
type AnalysisKey = Lowercase<(typeof ANALYSIS_LABELS)[number]>;

export function parseLabeledAnalysis(value: string) {
  const result: Partial<Record<AnalysisKey, string>> = {};
  for (let index = 0; index < ANALYSIS_LABELS.length; index += 1) {
    const label = ANALYSIS_LABELS[index]!;
    const following = ANALYSIS_LABELS.slice(index + 1).join("|");
    const pattern = following
      ? new RegExp(`${label}:\\s*([\\s\\S]*?)(?=(?:${following}):)`, "i")
      : new RegExp(`${label}:\\s*([\\s\\S]*)$`, "i");
    const match = value.match(pattern)?.[1]?.trim();
    if (match) result[label.toLowerCase() as AnalysisKey] = match;
  }
  return result;
}

export function normalizeAnalysisFields(input: Record<AnalysisKey, string | null>) {
  const fact = input.fact?.trim() ?? "";
  const upperFact = fact.toUpperCase();
  const labelPositions = ANALYSIS_LABELS.map((label) => upperFact.indexOf(`${label}:`));
  const isKnownLegacyShape = upperFact.startsWith("FACT:")
    && labelPositions.every((position, index) => position >= 0 && (index === 0 || position > labelPositions[index - 1]!))
    && ANALYSIS_LABELS.every((label) => upperFact.indexOf(`${label}:`) === upperFact.lastIndexOf(`${label}:`));
  const parsed = isKnownLegacyShape ? parseLabeledAnalysis(fact) : {};

  return Object.fromEntries(ANALYSIS_LABELS.map((label) => {
    const key = label.toLowerCase() as AnalysisKey;
    const current = input[key];
    if (!parsed[key]) return [key, current];
    if (key === "fact" || !current) return [key, parsed[key]];

    const labelPosition = labelPositions[ANALYSIS_LABELS.indexOf(label)]!;
    const expectedLegacySuffix = fact.slice(labelPosition + label.length + 1).trim();
    return [key, current.trim() === expectedLegacySuffix ? parsed[key] : current];
  })) as Record<AnalysisKey, string | null>;
}

export function buildOriginalContent(oneLineSummary: string, fact: string | null): OriginalContentDto {
  const sections = [
    oneLineSummary ? { title: "사건 개요", body: oneLineSummary } : null,
    fact && fact !== oneLineSummary ? { title: "확인된 발표·보도", body: fact } : null,
  ].filter((section): section is { title: string; body: string } => Boolean(section));

  return sections.length
    ? { mode: "detailed_summary", label: "원문 기반 상세 요약", sections }
    : { mode: "unavailable", label: "원문 내용 미확보", sections: [] };
}
