type QueryInput = {
  projectId: string;
  teamId?: string;
  environment: "production" | "preview";
  since: string;
  until: string;
};

export function buildVercelVisitorCountUrl(input: QueryInput) {
  const url = new URL("https://api.vercel.com/v1/query/web-analytics/visits/count");
  url.searchParams.set("projectId", input.projectId);
  url.searchParams.set("since", input.since);
  url.searchParams.set("until", input.until);
  url.searchParams.set("filter", `environment eq '${input.environment}'`);
  if (input.teamId) url.searchParams.set("teamId", input.teamId);
  return url;
}

export function parseVercelVisitorCount(value: unknown): number | null {
  if (!value || typeof value !== "object") return null;
  const data = (value as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  const visitors = (data as { visitors?: unknown }).visitors;
  return Number.isSafeInteger(visitors) && Number(visitors) >= 0 ? Number(visitors) : null;
}
