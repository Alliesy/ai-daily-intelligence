import { describe, expect, it } from "vitest";
import { safeReturnPath } from "./return-path";

describe("safeReturnPath", () => {
  it("keeps local routes with search and hash", () => expect(safeReturnPath("/events/a?tab=source#top")).toBe("/events/a?tab=source#top"));
  it.each(["https://evil.example", "//evil.example/x", "/\\evil", "/%5cevil", "/%255cevil", "/%25255cevil", "/%25252525255cevil", "/%252500evil", "javascript:alert(1)"])("rejects unsafe return path %s", (value) => expect(safeReturnPath(value)).toBe("/"));
  it("falls back for malformed encoding", () => expect(safeReturnPath("/%E0%A4%A")).toBe("/"));
});
