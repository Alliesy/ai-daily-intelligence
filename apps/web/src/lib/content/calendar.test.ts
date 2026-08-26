import { describe, expect, test } from "vitest";
import { buildCalendarGrid, isValidDateKst, shiftArchiveMonth } from "./calendar";

describe("Archive calendar", () => {
  test("maps only existing briefing dates to selectable cells", () => {
    const grid = buildCalendarGrid("2026-08", ["2026-08-07", "2026-08-26"]);
    expect(grid.leadingBlanks).toBe(5);
    expect(grid.cells).toHaveLength(31);
    expect(grid.cells.find((cell) => cell.day === 7)).toMatchObject({ dateKst: "2026-08-07", hasBriefing: true });
    expect(grid.cells.find((cell) => cell.day === 6)).toMatchObject({ dateKst: "2026-08-06", hasBriefing: false });
  });

  test("fails closed for an invalid month", () => {
    expect(buildCalendarGrid("2026-8", ["2026-08-07"]).cells).toEqual([]);
  });

  test("moves months with UTC-safe year boundaries", () => {
    expect(shiftArchiveMonth("2026-08", 1)).toBe("2026-09");
    expect(shiftArchiveMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftArchiveMonth("2026-12", 1)).toBe("2027-01");
  });

  test("rejects impossible archive dates before querying the DAL", () => {
    expect(isValidDateKst("2026-08-26")).toBe(true);
    expect(isValidDateKst("2026-02-30")).toBe(false);
    expect(isValidDateKst("2026-99-99")).toBe(false);
  });
});
