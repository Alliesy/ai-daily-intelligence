// Disposable PostgreSQL WASM test; never connects to a remote/Production DB.
// npm install --prefix /tmp/reader-db-qa @electric-sql/pglite@0.5.8
// PGLITE_ROOT=/tmp/reader-db-qa/node_modules/@electric-sql/pglite node supabase/tests/reader-integration.mjs
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { projectDailyPacket } from "../../packages/importer/dist/projection.js";
import { registryChecksum, rawChecksum, projectionInputChecksum } from "../../packages/importer/dist/checksums.js";

const root = resolve(import.meta.dirname, "../..");
const moduleRoot = process.env.PGLITE_ROOT;
if (!moduleRoot) throw new Error("Set PGLITE_ROOT to the installed disposable PGlite package");
const { PGlite } = await import(pathToFileURL(resolve(moduleRoot, "dist/index.js")).href);
const { pgcrypto } = await import(pathToFileURL(resolve(moduleRoot, "dist/contrib/pgcrypto.js")).href);
const read = (file) => readFile(resolve(root, file), "utf8");
const json = async (file) => JSON.parse(await read(file));
const registries = { events: await json("data/identity/event-aliases.json"), sources: await json("data/identity/source-aliases.json") };
const checksum = registryChecksum(registries);
const sha = "a".repeat(40);
const reader = { version: "1.3", headline: "원고 제목", dek: "요약 문장", body: " 첫 문단.\n\n둘째 문단. ", takeaway: null, what_to_watch: "발표 일정", action: null };
const base = await json("data/daily/2026/2026-08-07.json");

async function database() {
  const db = new PGlite({ extensions: { pgcrypto } });
  // Minimal Supabase Auth boundary for the repository's real migrations/RLS tests.
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users (id uuid primary key, aud text, role text, email text, encrypted_password text,
      email_confirmed_at timestamptz, raw_app_meta_data jsonb, raw_user_meta_data jsonb, created_at timestamptz, updated_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$
      select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
    $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;`);
  for (const file of (await readdir(resolve(root, "supabase/migrations"))).filter((name) => name.endsWith(".sql")).sort()) await db.exec(await read(`supabase/migrations/${file}`));
  await db.exec(`select set_config('request.jwt.claims', '{"role":"service_role"}', false)`);
  await db.query("select public.apply_identity_registry($1,$2,$3,$4,null,null)", [registries.events, registries.sources, sha, checksum]);
  return db;
}

async function ingest(db, packet, expected = null, projectionVersion) {
  const raw = rawChecksum(Buffer.from(JSON.stringify(packet)));
  const result = await db.query("select public.import_daily_packet($1,$2,$3,$4,$5,$6,$7,$8) as result", [
    `data/daily/2026/${packet.date_kst}.json`, projectDailyPacket(packet, registries), sha, expected, 1, raw, checksum,
    projectionInputChecksum(raw, checksum, projectionVersion),
  ]);
  return result.rows[0].result;
}
async function snapshots(db) {
  return (await db.query(`select b.date_kst::text, e.canonical_event_key, o.reader
    from public.daily_briefing_events o join public.daily_briefings b on b.id=o.briefing_id
    join public.events e on e.id=o.event_id order by b.date_kst,e.canonical_event_key`)).rows;
}

const db = await database();
try {
  const a = structuredClone(base); a.news[0].reader = reader;
  const b = structuredClone(a); b.date_kst = "2026-08-08"; b.generated_at = "2026-08-08T07:00:00+09:00"; b.news[0].reader.body = "날짜 B 본문";
  assert.equal((await ingest(db, a)).status, "succeeded");
  assert.equal((await ingest(db, b)).status, "succeeded");
  const before = await snapshots(db);
  await ingest(db, a, sha);
  assert.deepEqual(await snapshots(db), before, "reimport must be idempotent and keep date B");
  const first = before.find((row) => row.date_kst === a.date_kst && row.canonical_event_key === a.news[0].event_key);
  assert.deepEqual(first.reader, reader, "all strings, nulls and paragraph boundaries survive SQL");
  const latest = await db.query(`select o.reader from public.daily_briefing_events o
    join public.daily_briefings b on b.id=o.briefing_id join public.events e on e.id=o.event_id
    where e.canonical_event_key=$1 order by b.date_kst desc,b.source_revision desc limit 1`, [a.news[0].event_key]);
  assert.equal(latest.rows[0].reader.body, "날짜 B 본문");
  const rebuild = await database();
  try { await ingest(rebuild, a); await ingest(rebuild, b); assert.deepEqual(await snapshots(rebuild), before); } finally { await rebuild.close(); }
  const stale = structuredClone(a); stale.news[0].reader.body = "must not overwrite";
  assert.equal((await ingest(db, stale, "b".repeat(40))).status, "retry_cursor_changed");
  assert.deepEqual(await snapshots(db), before);
  // Direct RPC callers cannot bypass the Reader contract; failure is atomic.
  const broken = projectDailyPacket(a, registries);
  delete broken.news[0].reader.body;
  await assert.rejects(db.query("select public.import_daily_packet($1,$2,$3,$4,$5,$6,$7,$8)", [
    `data/daily/2026/${a.date_kst}.json`, broken, sha, sha, 1, "c".repeat(64), checksum, "d".repeat(64),
  ]), /invalid Reader contract/);
  assert.deepEqual(await snapshots(db), before);
  // A valid correction without Reader removes only this occurrence's Reader.
  await ingest(db, base, sha);
  const corrected = await snapshots(db);
  assert.equal(corrected.find((row) => row.date_kst === a.date_kst && row.canonical_event_key === a.news[0].event_key).reader, null);
  assert.equal(corrected.find((row) => row.date_kst === b.date_kst && row.canonical_event_key === a.news[0].event_key).reader.body, "날짜 B 본문");
  await db.exec(await read("supabase/tests/schema_contract.sql"));
  await db.exec(await read("supabase/tests/rls_integration.sql"));
  console.log("PASS: real SQL migrations, lossless snapshots, date isolation, reimport, rebuild, stale CAS, schema contract, RLS and account cascade (PGlite with Auth stub).");
} finally { await db.close(); }
