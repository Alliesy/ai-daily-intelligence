export type VisitorStats = {
  todayUnique: number | null;
  cumulativeUnique: null;
  source: "vercel-web-analytics" | "unavailable";
};

export function parseVisitorStats(value: unknown): VisitorStats | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const todayUnique = record.todayUnique;
  if (todayUnique !== null && (!Number.isSafeInteger(todayUnique) || Number(todayUnique) < 0)) return null;
  if (record.cumulativeUnique !== null) return null;
  if (record.source !== "vercel-web-analytics" && record.source !== "unavailable") return null;
  return {
    todayUnique: todayUnique === null ? null : Number(todayUnique),
    cumulativeUnique: null,
    source: record.source,
  };
}
