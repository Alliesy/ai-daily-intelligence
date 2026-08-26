import "server-only";

import { kstDayRange } from "./kst-day";
import type { VisitorStats } from "./types";
import { buildVercelVisitorCountUrl, parseVercelVisitorCount } from "./visitor-request";

const unavailable: VisitorStats = {
  todayUnique: null,
  cumulativeUnique: null,
  source: "unavailable",
};

function environment(): "production" | "preview" {
  return process.env.VERCEL_ENV === "preview" ? "preview" : "production";
}

export async function getAnonymousVisitorStats(): Promise<VisitorStats> {
  const token = process.env.VERCEL_ANALYTICS_READ_TOKEN?.trim();
  const projectId = process.env.VERCEL_ANALYTICS_PROJECT_ID?.trim();
  const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID?.trim();
  if (!token || !projectId) return unavailable;

  const url = buildVercelVisitorCountUrl({
    projectId,
    teamId: teamId || undefined,
    environment: environment(),
    ...kstDayRange(),
  });

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) return unavailable;
    const todayUnique = parseVercelVisitorCount(await response.json());
    return todayUnique === null ? unavailable : {
      todayUnique,
      cumulativeUnique: null,
      source: "vercel-web-analytics",
    };
  } catch {
    return unavailable;
  }
}
