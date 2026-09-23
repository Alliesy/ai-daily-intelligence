import { expect, test, vi } from "vitest";

const fixtures = vi.hoisted(() => {
  const reader = (body: string) => ({ version: "1.3", headline: "제목", dek: "요약", body, takeaway: null, what_to_watch: null, action: null });
  const a = { event_key: "same", title: "legacy A", one_line_summary: "A 요약", reader: reader("A 본문") };
  const b = { ...a, title: "legacy B", reader: reader("B 본문") };
  return { a, b, dates: ["2026-09-20", "2026-09-21"] };
});
vi.mock("server-only", () => ({}));
vi.mock("node:fs", () => ({ promises: {
  stat: async () => ({ isDirectory: () => true }),
  readdir: async (path: string) => path.endsWith("2026") ? fixtures.dates.map((date) => `${date}.json`) : [{ name: "2026", isDirectory: () => true }],
  readFile: async (path: string) => JSON.stringify({ date_kst: fixtures.dates[path.includes("2026-09-21") ? 1 : 0], news: [path.includes("2026-09-21") ? fixtures.b : fixtures.a] }),
} }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ from: (table: string) => {
  const query = {
    select: () => query, eq: () => query, in: () => query,
    maybeSingle: async () => ({ data: { id: "same", merged_into_event_id: null }, error: null }),
    then: (resolve: (result: unknown) => unknown) => resolve({ error: null, data:
      table === "daily_briefing_events" ? [fixtures.a, fixtures.b].map((item, index) => ({
        event_id: "same", briefing_id: fixtures.dates[index], title_original: item.title,
        one_line_summary_ko: item.one_line_summary, reader: item.reader,
        daily_briefings: { date_kst: fixtures.dates[index], source_revision: index ? 2 : 99 },
      })) : table === "events" ? [{ id: "same", slug: "same", canonical_event_key: "same", title_original: "global latest must not replace snapshot", reader: { ...fixtures.b.reader, body: "wrong global reader" } }] : [],
    }),
  };
  return query;
} }) }));
import { getArchiveEvent } from "./archive";
import { getSupabaseEventRoute } from "./supabase";

test("both real adapters select A/B/latest Reader from the occurrence and preserve legacy fallback", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://preview.example.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-public-key");
  try {
    for (const [date, expected] of [["2026-09-20", "A 본문"], ["2026-09-21", "B 본문"], [undefined, "B 본문"]]) {
      expect((await getArchiveEvent("same", date))?.reader?.body).toBe(expected);
      const route = await getSupabaseEventRoute("same", date);
      expect(route?.kind === "event" && route.event.reader?.body).toBe(expected);
    }
    const original = fixtures.b.reader;
    fixtures.b.reader = undefined as never;
    try {
      expect((await getArchiveEvent("same"))?.reader).toBeNull();
      const route = await getSupabaseEventRoute("same");
      expect(route?.kind === "event" && route.event.reader).toBeNull();
    } finally { fixtures.b.reader = original; }
  } finally { vi.unstubAllEnvs(); }
});
