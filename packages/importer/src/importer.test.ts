import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { projectionInputChecksum, rawChecksum, registryChecksum } from "./checksums.js";
import { buildEffectiveRegistries, uuidV5 } from "./effective-registry.js";
import { classifyRevision } from "./git.js";
import { runImporter } from "./importer.js";
import { projectDailyPacket } from "./projection.js";
import type { GitRunner, GitRunResult, RpcClient, RpcResult } from "./types.js";
import { normalizeUrl } from "./url-normalization.js";
import {
  createValidators,
  defaultSchemaPaths,
  parseDailyPacket,
  parseRegistries,
  validatePacketIdentities,
  validateRegistryTransition,
} from "./validation.js";

const repoRoot = path.resolve(import.meta.dirname, "../../..");
const A = "a".repeat(40);
const B = "b".repeat(40);
const C = "c".repeat(40);
const D = "d".repeat(40);

test("normalizes generic tracking parameters without dropping unknown query semantics", () => {
  assert.equal(
    normalizeUrl("HTTPS://Example.COM:443/story?utm_source=x&edition=kr&b=2#top").normalizedUrl,
    "https://example.com/story?b=2&edition=kr",
  );
});

test("normalizes YouTube, X and GitHub provider variants conservatively", () => {
  const youtube = normalizeUrl("https://youtu.be/dQw4w9WgXcQ?si=share&t=42&list=PL1");
  assert.equal(youtube.normalizedUrl, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.deepEqual(youtube.metadata, { list: "PL1", t: "42" });
  assert.equal(normalizeUrl("https://twitter.com/OpenAI/status/12345/photo/1?s=20").normalizedUrl, "https://x.com/i/status/12345");
  assert.equal(normalizeUrl("https://www.youtube.com/live/dQw4w9WgXcQ?feature=share").normalizedUrl, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.equal(normalizeUrl("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ").normalizedUrl, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.equal(normalizeUrl("https://github.com/OpenAI/SDK.git?utm_campaign=x").normalizedUrl, "https://github.com/openai/sdk");
  assert.notEqual(
    normalizeUrl("https://github.com/openai/sdk/issues/1").normalizedUrl,
    normalizeUrl("https://github.com/openai/sdk/pull/1").normalizedUrl,
  );
});

test("uses an explicit canonical override without following redirects", () => {
  const result = normalizeUrl("https://example.com/redirect?id=1", { canonicalOverride: "https://example.org/canonical" });
  assert.equal(result.normalizedUrl, "https://example.org/canonical");
  assert.equal(result.usedCanonicalOverride, true);
});

test("Git decisions handle bootstrap, same SHA, descendants, stale ancestors and divergence", async () => {
  const git = new GraphGitRunner([[A, B], [B, C], [A, C]]);
  assert.deepEqual(await classifyRevision(git, null, B, C), { action: "apply", reason: "bootstrap" });
  assert.deepEqual(await classifyRevision(git, B, B, C), { action: "skip", reason: "same_sha" });
  assert.deepEqual(await classifyRevision(git, A, B, C), { action: "apply", reason: "descendant" });
  assert.deepEqual(await classifyRevision(git, C, B, C), { action: "skip", reason: "stale_ancestor" });
  assert.deepEqual(await classifyRevision(git, D, B, C), { action: "fail", reason: "diverged" });
});

test("A to B to A content still advances projection checksums by accepted input state", () => {
  const rawA = rawChecksum(Buffer.from("A"));
  const rawB = rawChecksum(Buffer.from("B"));
  const registry = "1".repeat(64);
  const firstA = projectionInputChecksum(rawA, registry);
  const middleB = projectionInputChecksum(rawB, registry);
  const lastA = projectionInputChecksum(rawA, registry);
  assert.notEqual(firstA, middleB);
  assert.equal(firstA, lastA);
  // Git ancestry, not checksum monotonicity, authorizes the final A import.
});

test("validates the real archive and produces conservative projection source fields", async () => {
  const { validators, registries, packet } = await loadRealFixtures();
  validatePacketIdentities(packet, registries);
  const projection = projectDailyPacket(packet, registries);
  const source = projection.news[0]!.sources[0]!;
  assert.equal(source.raw_url, packet.news[0]!.sources[0]!.url);
  assert.equal(source.source_type, "article");
  assert.equal(source.authority, "independent");
  assert.equal(source.taxonomy_rule_version, "source-taxonomy-v1");
  assert.equal(source.verification_status, "unverified");
  const official = projection.news[1]!.sources[0]!;
  assert.equal(official.source_type, "official_blog");
  assert.equal(official.authority, "official");
  assert.equal(official.verification_status, "unverified");
  assert.ok(registryChecksum(registries).match(/^[0-9a-f]{64}$/));
  assert.ok(validators.daily(packet));
});

test("rejects packets with missing Event or Source identities", async () => {
  const { registries, packet } = await loadRealFixtures();
  const missingEvent = structuredClone(packet);
  missingEvent.news[0]!.event_key = "missing-event";
  assert.throws(() => validatePacketIdentities(missingEvent, registries), /missing or ambiguous/);
  const missingSource = structuredClone(packet);
  missingSource.news[0]!.sources[0]!.url = "https://example.com/unregistered";
  assert.throws(() => validatePacketIdentities(missingSource, registries), /missing or ambiguous/);
});

test("registry transitions reject omissions and preserve prior canonical values on rename", async () => {
  const { registries } = await loadRealFixtures();
  const omitted = structuredClone(registries);
  omitted.events.events.pop();
  assert.throws(() => validateRegistryTransition(registries, omitted), /cannot omit identity/);

  const unsafeRename = structuredClone(registries);
  unsafeRename.events.events[0]!.canonical_key = "renamed-key";
  assert.throws(() => validateRegistryTransition(registries, unsafeRename), /must preserve the prior canonical/);

  const safeRename = structuredClone(registries);
  const event = safeRename.events.events[0]!;
  event.aliases.push(event.canonical_key);
  event.canonical_key = "renamed-key";
  assert.doesNotThrow(() => validateRegistryTransition(registries, safeRename));
});

test("discovers new archive Event and Source identities deterministically", async () => {
  const { registries, packet } = await loadRealFixtures();
  const expanded = structuredClone(packet);
  const event = expanded.news[0]!;
  event.event_key = "2026-08-new-effective-event";
  event.sources[0]!.url = "https://youtu.be/dQw4w9WgXcQ?si=tracking";
  event.original_url = event.sources[0]!.url;

  const effective = buildEffectiveRegistries(registries, [expanded], B);
  validatePacketIdentities(expanded, effective);
  assert.doesNotThrow(() => projectDailyPacket(expanded, effective));
  const eventIdentity = effective.events.events.find((identity) => identity.canonical_key === event.event_key);
  assert.equal(eventIdentity?.event_uid, uuidV5(registries.events.namespace_uuid, `event:${event.event_key}`));
  assert.equal(eventIdentity?.identity_seed, event.event_key);
  const canonicalSource = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  const sourceIdentity = effective.sources.sources.find((identity) => identity.canonical_url === canonicalSource);
  assert.equal(sourceIdentity?.source_uid, uuidV5(registries.sources.namespace_uuid, `source:${canonicalSource}`));
  assert.equal(sourceIdentity?.identity_seed, canonicalSource);
});

test("empty-registry archive reconstruction produces stable IDs and checksum", async () => {
  const { registries, packet } = await loadRealFixtures();
  const empty = structuredClone(registries);
  empty.events.events = [];
  empty.sources.sources = [];
  const first = buildEffectiveRegistries(empty, [packet], B);
  const second = buildEffectiveRegistries(structuredClone(empty), [structuredClone(packet)], B);
  assert.deepEqual(first, second);
  assert.equal(registryChecksum(first), registryChecksum(second));
  for (const identity of first.events.events) {
    assert.equal(identity.event_uid, uuidV5(first.events.namespace_uuid, `event:${identity.identity_seed}`));
  }
  for (const identity of first.sources.sources) {
    assert.equal(identity.source_uid, uuidV5(first.sources.namespace_uuid, `source:${identity.identity_seed}`));
  }
});

test("registry checksum excludes commit provenance but includes semantic identities", async () => {
  const { registries } = await loadRealFixtures();
  const nextCommit = structuredClone(registries);
  nextCommit.events.generated_from_commit = B;
  nextCommit.sources.generated_from_commit = B;
  assert.equal(registryChecksum(registries), registryChecksum(nextCommit));
  const raw = rawChecksum(Buffer.from("same archive packet"));
  assert.equal(
    projectionInputChecksum(raw, registryChecksum(registries)),
    projectionInputChecksum(raw, registryChecksum(nextCommit)),
  );
  nextCommit.events.events[0]!.reason = "Reviewed correction";
  assert.notEqual(registryChecksum(registries), registryChecksum(nextCommit));
});

test("a newer registry state supersedes the entire older run before any write RPC", async () => {
  const git = new SnapshotGitRunner([[B, C]]);
  const rpc = new RecordingRpc({
    get_sync_cursor: null,
    get_identity_registry_state: {
      source_commit_sha: C,
      registry_checksum: "f".repeat(64),
    },
  });
  const report = await runImporter({
    repoRoot,
    commitSha: B,
    remoteMainSha: C,
    mode: "backfill",
    git,
    rpc,
    packetPaths: ["data/daily/2026/2026-08-07.json"],
  });
  assert.equal(report.registryAction, "skip:stale_ancestor");
  assert.equal(report.packets[0]?.reason, "registry_state_is_newer");
  assert.deepEqual(rpc.calls.map((call) => call.name), ["get_sync_cursor", "get_identity_registry_state"]);
});

test("registry and packet RPCs receive both CAS watermarks on a descendant run", async () => {
  const { registries } = await loadRealFixtures();
  const checksum = registryChecksum(registries);
  const git = new SnapshotGitRunner([[A, B]]);
  const rpc = new RecordingRpc({
    get_sync_cursor: null,
    get_identity_registry_state: { source_commit_sha: A, registry_checksum: checksum },
    apply_identity_registry: { status: "succeeded" },
    import_daily_packet: { status: "succeeded" },
  });
  await runImporter({
    repoRoot,
    commitSha: B,
    remoteMainSha: B,
    mode: "backfill",
    git,
    rpc,
    packetPaths: ["data/daily/2026/2026-08-07.json"],
  });
  const registryCall = rpc.calls.find((call) => call.name === "apply_identity_registry");
  assert.equal(registryCall?.parameters.p_expected_registry_commit_sha, A);
  assert.equal(registryCall?.parameters.p_expected_registry_checksum, checksum);
  const packetCall = rpc.calls.find((call) => call.name === "import_daily_packet");
  assert.equal(packetCall?.parameters.p_expected_cursor_sha, null);
});

test("descendant A-B-A content advances cursor while a delayed stale run writes nothing", async () => {
  const git = new ContentHistoryGitRunner([[A, B], [B, C], [A, C]]);
  const rpc = new StatefulRpc();
  for (const commitSha of [A, B, C]) {
    await runImporter({
      repoRoot,
      commitSha,
      remoteMainSha: C,
      mode: "backfill",
      git,
      rpc,
      packetPaths: ["data/daily/2026/2026-08-07.json"],
    });
  }
  assert.equal(rpc.cursorSha, C);
  assert.equal(rpc.rawChecksums.length, 3);
  assert.equal(rpc.rawChecksums[0], rpc.rawChecksums[2]);
  assert.notEqual(rpc.rawChecksums[0], rpc.rawChecksums[1]);
  const writesBeforeStaleRun = rpc.writeCount;
  await runImporter({
    repoRoot,
    commitSha: B,
    remoteMainSha: C,
    mode: "backfill",
    git,
    rpc,
    packetPaths: ["data/daily/2026/2026-08-07.json"],
  });
  assert.equal(rpc.writeCount, writesBeforeStaleRun);
  assert.equal(rpc.cursorSha, C);
});

async function loadRealFixtures() {
  const validators = await createValidators(defaultSchemaPaths(repoRoot));
  const [eventRaw, sourceRaw, packetRaw] = await Promise.all([
    readFile(path.join(repoRoot, "data/identity/event-aliases.json")),
    readFile(path.join(repoRoot, "data/identity/source-aliases.json")),
    readFile(path.join(repoRoot, "data/daily/2026/2026-08-07.json")),
  ]);
  const registries = await parseRegistries(eventRaw, sourceRaw, validators);
  const packet = await parseDailyPacket(packetRaw, validators.daily);
  return { validators, registries, packet };
}

class GraphGitRunner implements GitRunner {
  private readonly commits = new Set([A, B, C, D]);
  private readonly ancestors = new Set<string>();

  constructor(edges: Array<[string, string]>) {
    for (const [ancestor, descendant] of edges) this.ancestors.add(`${ancestor}:${descendant}`);
  }

  async run(args: readonly string[]): Promise<GitRunResult> {
    if (args[0] === "cat-file") {
      const sha = args[2]?.replace(/\^\{commit\}$/, "") ?? "";
      return result(this.commits.has(sha) ? 0 : 1);
    }
    if (args[0] === "merge-base") {
      const ancestor = args[2] ?? "";
      const descendant = args[3] ?? "";
      return result(ancestor === descendant || this.ancestors.has(`${ancestor}:${descendant}`) ? 0 : 1);
    }
    return result(2, "unsupported fake command");
  }
}

class SnapshotGitRunner extends GraphGitRunner {
  override async run(args: readonly string[]): Promise<GitRunResult> {
    if (args[0] === "show") {
      const spec = args[1] ?? "";
      const separator = spec.indexOf(":");
      const filePath = separator >= 0 ? spec.slice(separator + 1) : "";
      try {
        return { code: 0, stdout: await readFile(path.join(repoRoot, filePath), "utf8"), stderr: "" };
      } catch (error) {
        return result(1, String(error));
      }
    }
    if (args[0] === "rev-list") return { code: 0, stdout: "42\n", stderr: "" };
    if (args[0] === "ls-tree") {
      return { code: 0, stdout: "data/daily/2026/2026-08-07.json\n", stderr: "" };
    }
    return super.run(args);
  }
}

class ContentHistoryGitRunner extends SnapshotGitRunner {
  override async run(args: readonly string[]): Promise<GitRunResult> {
    if (args[0] === "show" && args[1]?.endsWith(":data/daily/2026/2026-08-07.json")) {
      const packet = JSON.parse(await readFile(path.join(repoRoot, "data/daily/2026/2026-08-07.json"), "utf8")) as Record<string, unknown>;
      if (args[1].startsWith(`${B}:`)) packet.todays_insight = "B revision contains a deliberately different but valid insight.";
      return { code: 0, stdout: JSON.stringify(packet), stderr: "" };
    }
    return super.run(args);
  }
}

class RecordingRpc implements RpcClient {
  readonly calls: Array<{ name: string; parameters: Record<string, unknown> }> = [];

  constructor(private readonly responses: Record<string, unknown>) {}

  async rpc<T>(functionName: string, parameters: Record<string, unknown>): Promise<RpcResult<T>> {
    this.calls.push({ name: functionName, parameters });
    return { data: (this.responses[functionName] ?? null) as T, error: null };
  }
}

class StatefulRpc implements RpcClient {
  registryState: { source_commit_sha: string; registry_checksum: string } | null = null;
  cursorSha: string | null = null;
  cursorChecksum: string | null = null;
  projectionChecksum: string | null = null;
  readonly rawChecksums: string[] = [];
  writeCount = 0;

  async rpc<T>(functionName: string, parameters: Record<string, unknown>): Promise<RpcResult<T>> {
    if (functionName === "get_identity_registry_state") return this.success(this.registryState);
    if (functionName === "get_sync_cursor") {
      return this.success(this.cursorSha === null ? null : {
        packet_path: parameters.p_packet_path,
        authoritative_commit_sha: this.cursorSha,
        authoritative_revision: 42,
        authoritative_checksum: this.cursorChecksum,
        authoritative_projection_checksum: this.projectionChecksum,
      });
    }
    if (functionName === "apply_identity_registry") {
      this.writeCount += 1;
      this.registryState = {
        source_commit_sha: String(parameters.p_source_commit_sha),
        registry_checksum: String(parameters.p_registry_checksum),
      };
      return this.success({ status: "succeeded" });
    }
    if (functionName === "import_daily_packet") {
      this.writeCount += 1;
      this.cursorSha = String(parameters.p_source_commit_sha);
      this.cursorChecksum = String(parameters.p_raw_checksum);
      this.projectionChecksum = String(parameters.p_projection_input_checksum);
      this.rawChecksums.push(this.cursorChecksum);
      return this.success({ status: "succeeded" });
    }
    return { data: null, error: { message: `Unexpected RPC ${functionName}` } };
  }

  private success<T>(data: unknown): RpcResult<T> {
    return { data: data as T, error: null };
  }
}

function result(code: number, stderr = ""): GitRunResult {
  return { code, stdout: "", stderr };
}
