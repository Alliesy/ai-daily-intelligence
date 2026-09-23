import { describe, expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseReaderContent, eventReaderHeader } from "./reader-v13";
import { selectOccurrenceByDate } from "./selection";

vi.mock("server-only", () => ({}));
const reader = { version: "1.3", headline: "제목", dek: "요약", body: " 첫 문단.\n\n두 번째 문단. ", takeaway: null, what_to_watch: null, action: null };

describe("atomic V1.3 reader", () => {
  test("keeps strings and paragraph boundaries losslessly", () => {
    expect(parseReaderContent(reader)).toEqual({ ...reader, what_to_watch: undefined, whatToWatch: null });
    expect(eventReaderHeader({ reader: parseReaderContent(reader), title: "legacy", oneLineSummary: "legacy summary" })).toEqual({ headline: reader.headline, dek: reader.dek });
  });
  test.each([undefined, null, {}, { ...reader, version: "1.4" }, { ...reader, body: " " }, { ...reader, action: "" }, { ...reader, dek: undefined }, { ...reader, extra: "unknown" }])("invalid reader falls back as a whole: %j", (value) => {
    expect(parseReaderContent(value)).toBeNull();
    expect(eventReaderHeader({ reader: parseReaderContent(value), title: "legacy", oneLineSummary: "legacy summary" })).toEqual({ headline: "legacy", dek: "legacy summary" });
  });
  test("nullable fields support every presence combination", () => {
    for (let mask = 0; mask < 8; mask++) {
      const value = { ...reader, takeaway: mask & 1 ? "의미" : null, what_to_watch: mask & 2 ? "변수" : null, action: mask & 4 ? "행동" : null };
      const parsed = parseReaderContent(value)!;
      expect(parsed.takeaway).toBe(value.takeaway);
      expect(parsed.whatToWatch).toBe(value.what_to_watch);
      expect(parsed.action).toBe(value.action);
    }
  });
  test("same event on A/B chooses that date, generic chooses latest, never inherits older reader", () => {
    const rows = [
      { event_id: "same", reader, daily_briefings: { date_kst: "2026-09-20", source_revision: 50 } },
      { event_id: "same", reader: { ...reader, body: "B 본문" }, daily_briefings: { date_kst: "2026-09-21", source_revision: 2 } },
    ];
    expect(parseReaderContent(selectOccurrenceByDate(rows, "2026-09-20")?.reader)?.body).toBe(reader.body);
    expect(parseReaderContent(selectOccurrenceByDate(rows, "2026-09-21")?.reader)?.body).toBe("B 본문");
    expect(parseReaderContent(selectOccurrenceByDate(rows)?.reader)?.body).toBe("B 본문");
    const withoutLatestReader = rows.map((row, index) => index === 1 ? { ...row, reader: null } : row);
    expect(parseReaderContent(selectOccurrenceByDate(withoutLatestReader)?.reader)).toBeNull();
    expect(selectOccurrenceByDate(rows, "2026-09-19")).toBeNull();
  });
  test("all 13 pinned Reader specimens validate and preserve body; old archive remains legacy", () => {
    for (const date of ["2026-09-20", "2026-09-21", "2026-09-23"]) {
      const packet = JSON.parse(readFileSync(fileURLToPath(new URL(`../../../../../review/web-v1.3/packets/${date}.json`, import.meta.url)), "utf8"));
      for (const event of packet.news) expect(parseReaderContent(event.reader)?.body).toBe(event.reader.body);
    }
    const packet = JSON.parse(readFileSync(fileURLToPath(new URL("../../../../../data/daily/2026/2026-08-07.json", import.meta.url)), "utf8"));
    for (const event of packet.news) expect(parseReaderContent(event.reader)).toBeNull();
  });
});
