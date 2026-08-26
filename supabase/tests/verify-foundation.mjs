import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const readJson = async (path) => JSON.parse(await readFile(join(root, path), "utf8"));

function uuidV5(namespace, value) {
  const namespaceBytes = Buffer.from(namespace.replaceAll("-", ""), "hex");
  const digest = createHash("sha1")
    .update(Buffer.concat([namespaceBytes, Buffer.from(value, "utf8")]))
    .digest();
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.subarray(0, 16).toString("hex");
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join("-");
}

function unique(values, label) {
  assert.equal(new Set(values).size, values.length, `${label} must be unique`);
}

const eventRegistry = await readJson("data/identity/event-aliases.json");
const sourceRegistry = await readJson("data/identity/source-aliases.json");
const packet = await readJson("data/daily/2026/2026-08-07.json");
const eventSchema = await readJson("schema/event-aliases.schema.json");
const sourceSchema = await readJson("schema/source-aliases.schema.json");

assert.equal(eventRegistry.schema_version, "1.0");
assert.equal(sourceRegistry.schema_version, "1.0");
assert.equal(eventSchema.$schema, "https://json-schema.org/draft/2020-12/schema");
assert.equal(sourceSchema.$schema, "https://json-schema.org/draft/2020-12/schema");
assert.match(eventRegistry.generated_from_commit, /^[0-9a-f]{40}$/);
assert.match(sourceRegistry.generated_from_commit, /^[0-9a-f]{40}$/);

unique(eventRegistry.events.map((event) => event.event_uid), "event UIDs");
unique(
  eventRegistry.events.flatMap((event) => [event.canonical_key, ...event.aliases]),
  "event keys and aliases",
);
unique(sourceRegistry.sources.map((source) => source.source_uid), "source UIDs");
unique(
  sourceRegistry.sources.flatMap((source) => [source.canonical_url, ...source.aliases]),
  "source URLs and aliases",
);

for (const event of eventRegistry.events) {
  assert(event.identity_seed, `missing immutable identity seed for ${event.canonical_key}`);
  assert.equal(
    event.event_uid,
    uuidV5(eventRegistry.namespace_uuid, `event:${event.identity_seed}`),
    `unexpected bootstrap UUID for ${event.identity_seed}`,
  );
}
for (const source of sourceRegistry.sources) {
  assert(source.identity_seed, `missing immutable identity seed for ${source.canonical_url}`);
  assert.equal(
    source.source_uid,
    uuidV5(sourceRegistry.namespace_uuid, `source:${source.identity_seed}`),
    `unexpected bootstrap UUID for ${source.identity_seed}`,
  );
}

const knownEventKeys = new Set(eventRegistry.events.flatMap((event) => [event.canonical_key, ...event.aliases]));
const knownSourceUrls = new Set(sourceRegistry.sources.flatMap((source) => [source.canonical_url, ...source.aliases]));
for (const news of packet.news) {
  assert(knownEventKeys.has(news.event_key), `missing event identity: ${news.event_key}`);
  for (const source of news.sources) {
    assert(knownSourceUrls.has(source.url), `missing source identity: ${source.url}`);
  }
}

const migrations = [
  await readFile(join(root, "supabase/migrations/20260808000100_initial_v1_schema.sql"), "utf8"),
  await readFile(join(root, "supabase/migrations/20260808000200_identity_and_import_rpc.sql"), "utf8"),
  await readFile(join(root, "supabase/migrations/20260826000100_v11_morning_paper_projection.sql"), "utf8"),
].join("\n");

for (const table of [
  "daily_briefings", "events", "event_keys", "event_analysis", "sources", "source_urls",
  "event_sources", "event_source_occurrences", "topics", "event_topics", "entities",
  "event_entities", "daily_briefing_events", "opportunities", "daily_briefing_opportunities",
  "opportunity_events", "resources", "daily_briefing_resources", "trend_signals", "profiles",
  "reactions", "bookmarks", "follows",
]) {
  assert.match(migrations, new RegExp(`alter table public\\.${table} enable row level security;`));
}
assert.match(migrations, /security definer[\s\S]*set search_path = ''/i);
assert.match(
  migrations,
  /current_setting\('request\.jwt\.claims', true\)[\s\S]*coalesce\(actor_role, session_user\)/,
  "service-role guard must also work for direct database maintenance sessions",
);
assert.match(migrations, /pg_advisory_xact_lock\(7341220260808\)/);
assert.match(migrations, /retry_cursor_changed/);
assert.match(migrations, /retry_registry_changed/);
assert.match(migrations, /identity registry changed; retry with the current registry/);
assert.match(migrations, /identity registry cannot omit an existing identity/);
assert.match(migrations, /merged_into_event_id = registry\.merged_into_event_uid/);
assert.match(
  migrations,
  /packet_date::text \|\| ':' \|\| lower\(btrim\(idea_item ->> 'name'\)\)/,
  "legacy Opportunity fallback identity must include the briefing date",
);
assert.match(migrations, /stable_value := 'topic-' \|\| substring\(/, "non-ASCII topics need a stable slug fallback");
assert.match(migrations, /revoke all on function public\.import_daily_packet[\s\S]*from public, anon, authenticated;/i);
assert.match(migrations, /grant execute on function public\.import_daily_packet[\s\S]*to service_role;/i);
assert.match(migrations, /alter function public\.import_daily_packet\([\s\S]*set schema private;/i);
assert.match(migrations, /rename to import_daily_packet_core;/i);
assert.match(migrations, /revoke all on function private\.import_daily_packet_core[\s\S]*service_role;/i);
assert.match(migrations, /add column insight_headline text/);
assert.match(migrations, /add column insight_evidence_order integer/);
assert.match(migrations, /add column source_type_snapshot public\.source_type/);
assert.match(migrations, /add column problem_evidence jsonb/);
assert.match(migrations, /daily_briefing_opportunities_one_today_eligible_uidx/);
assert.match(migrations, /at most one Opportunity may be eligible for Today/i);
assert.match(migrations, /revoke all on function public\.get_sync_cursor\(text\)[\s\S]*from public, anon, authenticated;/i);
assert.match(migrations, /grant execute on function public\.get_sync_cursor\(text\)[\s\S]*to service_role;/i);
assert.match(migrations, /revoke all on function public\.get_identity_registry_state\(\)[\s\S]*from public, anon, authenticated;/i);
assert.match(migrations, /grant execute on function public\.get_identity_registry_state\(\)[\s\S]*to service_role;/i);
assert.doesNotMatch(migrations, /grant\s+(insert|update|delete|all)[^;]+to\s+anon/i);
assert.doesNotMatch(migrations, /grant\s+all\s+on\s+all\s+tables[^;]+service_role/i);
assert.doesNotMatch(migrations, /grant\s+(insert|update|delete|all)[^;]+daily_briefings[^;]+authenticated/i);

console.log("Supabase foundation contract verified.");
