"use client";

import { parseVisitorStats, type VisitorStats } from "./types";

type StatsRequest = () => Promise<VisitorStats | null>;

export function createStatsLoader(request: StatsRequest) {
  let inFlight: Promise<VisitorStats | null> | null = null;
  return () => {
    if (inFlight) return inFlight;
    const current = request().finally(() => {
      if (inFlight === current) inFlight = null;
    });
    inFlight = current;
    return current;
  };
}

export const loadVisitorStats = createStatsLoader(() =>
  fetch("/api/visits", {
      method: "GET",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => response.ok ? parseVisitorStats(await response.json()) : null)
      .catch(() => null),
);
