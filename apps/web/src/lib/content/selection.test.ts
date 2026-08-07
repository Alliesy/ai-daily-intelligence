import { describe, expect, it } from "vitest";
import { mergeRedirectSlug, selectLatestOccurrence, selectLatestSourceOccurrences } from "./selection";

describe("Event occurrence selection", () => {
  it("prefers the latest briefing date over a higher-revision past correction", () => {
    const latest = { briefing_id: "latest", daily_briefings: { date_kst: "2026-08-08", source_revision: 10 } };
    const correctedPast = { briefing_id: "past", daily_briefings: { date_kst: "2026-08-01", source_revision: 999 } };
    expect(selectLatestOccurrence([correctedPast, latest])).toBe(latest);
  });

  it("uses accepted revision only to break a same-date tie", () => {
    const oldRevision = { briefing_id: "a", daily_briefings: { date_kst: "2026-08-08", source_revision: 10 } };
    const newRevision = { briefing_id: "b", daily_briefings: { date_kst: "2026-08-08", source_revision: 11 } };
    expect(selectLatestOccurrence([oldRevision, newRevision])).toBe(newRevision);
  });
});

describe("Event source history selection", () => {
  it("keeps every distinct source and the latest verification occurrence for each", () => {
    const rows = [
      { event_id: "event", source_id: "official", verification_status: "verified", display_order: 0, is_primary: true, briefing_id: "new", daily_briefings: { date_kst: "2026-08-08", source_revision: 12 } },
      { event_id: "event", source_id: "official", verification_status: "unverified", display_order: 0, is_primary: true, briefing_id: "old", daily_briefings: { date_kst: "2026-08-01", source_revision: 99 } },
      { event_id: "event", source_id: "paper", verification_status: "corroborated", display_order: 1, is_primary: false, briefing_id: "old", daily_briefings: { date_kst: "2026-08-01", source_revision: 99 } },
    ];
    const selected = selectLatestSourceOccurrences(rows);
    expect(selected.map((row) => row.source_id)).toEqual(["official", "paper"]);
    expect(selected[0]?.verification_status).toBe("verified");
  });
});

describe("Event merge routing", () => {
  it("returns only the reviewed merge target slug", () => {
    expect(mergeRedirectSlug({ merged_into_event_id: "target" }, { id: "target", slug: "canonical-event" })).toBe("canonical-event");
    expect(mergeRedirectSlug({ merged_into_event_id: "target" }, { id: "other", slug: "wrong-event" })).toBeNull();
  });
});
