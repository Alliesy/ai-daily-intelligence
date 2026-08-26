import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const publicContentRoutes = [
  "../../app/page.tsx",
  "../../app/opportunities/page.tsx",
  "../../app/trends/page.tsx",
  "../../app/events/[slug]/page.tsx",
];

describe("public content rendering policy", () => {
  it.each(publicContentRoutes)("keeps %s dynamic so a successful archive sync is visible without a rebuild", (relativePath) => {
    const source = readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
    expect(source).toContain('export const dynamic = "force-dynamic";');
  });
});
