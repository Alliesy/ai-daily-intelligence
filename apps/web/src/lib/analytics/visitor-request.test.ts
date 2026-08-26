import { describe, expect, test } from "vitest";
import { buildVercelVisitorCountUrl, parseVercelVisitorCount } from "./visitor-request";
import { parseVisitorStats } from "./types";
import { createStatsLoader } from "./client";
import { kstDayKey, kstDayRange } from "./kst-day";

describe("anonymous visitor request safety", () => {
  test("builds a project-scoped, environment-filtered Vercel read query", () => {
    const url = buildVercelVisitorCountUrl({
      projectId: "prj_preview",
      teamId: "team_preview",
      environment: "preview",
      since: "2026-08-25T15:00:00.000Z",
      until: "2026-08-26T14:59:59.999Z",
    });
    expect(url.origin).toBe("https://api.vercel.com");
    expect(url.searchParams.get("projectId")).toBe("prj_preview");
    expect(url.searchParams.get("teamId")).toBe("team_preview");
    expect(url.searchParams.get("filter")).toBe("environment eq 'preview'");
  });

  test("accepts only non-negative integer visitor counts", () => {
    expect(parseVercelVisitorCount({ data: { visitors: 23, pageviews: 51 } })).toBe(23);
    expect(parseVercelVisitorCount({ data: { visitors: -1 } })).toBeNull();
    expect(parseVercelVisitorCount({ data: { visitors: 1.5 } })).toBeNull();
    expect(parseVercelVisitorCount({ data: { visitors: "23" } })).toBeNull();
  });

  test("requires cumulative unique to remain explicitly unsupported", () => {
    expect(parseVisitorStats({ todayUnique: 2, cumulativeUnique: null, source: "vercel-web-analytics" })).toEqual({
      todayUnique: 2,
      cumulativeUnique: null,
      source: "vercel-web-analytics",
    });
    expect(parseVisitorStats({ todayUnique: 2, cumulativeUnique: 12, source: "vercel-web-analytics" })).toBeNull();
  });

  test("deduplicates only concurrent requests and refreshes after completion", async () => {
    let calls = 0;
    let release: (() => void) | undefined;
    const loader = createStatsLoader(() => new Promise((resolve) => {
      calls += 1;
      release = () => resolve({ todayUnique: calls, cumulativeUnique: null, source: "vercel-web-analytics" });
    }));
    const first = loader();
    const concurrent = loader();
    expect(first).toBe(concurrent);
    expect(calls).toBe(1);
    release?.();
    await first;
    const next = loader();
    expect(calls).toBe(2);
    release?.();
    await next;
  });

  test("uses the KST calendar day across UTC midnight boundaries", () => {
    expect(kstDayKey(new Date("2026-08-26T14:59:59Z"))).toBe("2026-08-26");
    expect(kstDayKey(new Date("2026-08-26T15:00:00Z"))).toBe("2026-08-27");
    expect(kstDayRange(new Date("2026-08-26T03:00:00Z"))).toEqual({
      since: "2026-08-25T15:00:00.000Z",
      until: "2026-08-26T14:59:59.999Z",
    });
  });
});
