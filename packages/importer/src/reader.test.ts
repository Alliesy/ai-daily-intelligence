import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createValidators, defaultSchemaPaths } from "./validation.js";
import { projectDailyPacket, projectReader } from "./projection.js";
import { MAPPER_VERSION, projectionInputChecksum } from "./checksums.js";
import type { DailyPacket, IdentityRegistries } from "./types.js";

const root = path.resolve(import.meta.dirname, "../../..");
const json = async (file: string) => JSON.parse(await readFile(path.join(root, file), "utf8"));
test("Reader schema accepts legacy, all null combinations and rejects incomplete/old contracts", async () => {
  const validators = await createValidators(defaultSchemaPaths(root));
  const legacy = await json("data/daily/2026/2026-08-07.json");
  assert.equal(validators.daily(legacy), true);
  const packet = await json("review/web-v1.3/packets/2026-09-23.json");
  assert.equal(validators.daily(packet), true, JSON.stringify(validators.daily.errors));
  for (const key of ["version", "headline", "dek", "body", "takeaway", "what_to_watch", "action"]) {
    const broken = structuredClone(packet); delete broken.news[0].reader[key];
    assert.equal(validators.daily(broken), false, key);
    assert.throws(() => projectReader(broken.news[0].reader));
  }
  for (let mask = 0; mask < 8; mask++) {
    const next = structuredClone(packet);
    ["takeaway", "what_to_watch", "action"].forEach((key, index) => { next.news[0].reader[key] = mask & (1 << index) ? "내용" : null; });
    assert.equal(validators.daily(next), true);
  }
  const old = structuredClone(packet); old.news[0].reader.why_it_matters = old.news[0].reader.takeaway; delete old.news[0].reader.takeaway;
  assert.equal(validators.daily(old), false);
});

test("projection preserves every Reader field, is repeatable and does not mutate another date", async () => {
  const registries = { events: await json("data/identity/event-aliases.json"), sources: await json("data/identity/source-aliases.json") } as IdentityRegistries;
  for (const date of ["2026-09-20", "2026-09-21", "2026-09-23"]) {
    const packet = await json(`review/web-v1.3/packets/${date}.json`) as DailyPacket;
    const first = projectDailyPacket(packet, registries);
    const rebuilt = projectDailyPacket(packet, registries);
    assert.deepEqual(first, rebuilt);
    assert.deepEqual(first.news.map((n) => n.reader), packet.news.map((n) => n.reader));
    const secondDate = structuredClone(packet); secondDate.date_kst = "2026-09-24";
    const copy = projectReader(secondDate.news[0]!.reader); copy.body = "다른 날짜 원고"; secondDate.news[0]!.reader = copy;
    assert.notDeepEqual(projectDailyPacket(secondDate, registries).news[0]!.reader, first.news[0]!.reader);
    assert.deepEqual(first, rebuilt);
  }
  assert.equal(MAPPER_VERSION, "daily-projection-v1.3");
  assert.notEqual(projectionInputChecksum("raw", "registry"), projectionInputChecksum("raw", "registry", "daily-projection-v1.1"));
});
