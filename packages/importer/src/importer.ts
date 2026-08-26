import {
  MAPPER_VERSION,
  projectionInputChecksum,
  rawChecksum,
  registryChecksum,
} from "./checksums.js";
import { buildEffectiveRegistries } from "./effective-registry.js";
import {
  changedProjectionPaths,
  classifyRevision,
  diagnosticRevision,
  listArchivePaths,
  showFileAtCommit,
} from "./git.js";
import { projectDailyPacket } from "./projection.js";
import {
  applyIdentityRegistry,
  getIdentityRegistryState,
  getSyncCursor,
  importDailyPacket,
} from "./rpc.js";
import type { DailyPacket, GitRunner, IdentityRegistries, JsonObject, RpcClient } from "./types.js";
import {
  createValidators,
  defaultSchemaPaths,
  parseDailyPacket,
  parseRegistries,
  validatePacketIdentities,
  validateRegistryTransition,
} from "./validation.js";

export type ImportMode = "incremental" | "backfill" | "dry-run";

export interface RunImporterOptions {
  repoRoot: string;
  commitSha: string;
  remoteMainSha: string;
  mode: ImportMode;
  git: GitRunner;
  rpc?: RpcClient;
  packetPaths?: string[];
  mapperVersion?: string;
}

export interface ImportReport {
  mode: ImportMode;
  commitSha: string;
  registryChecksum: string;
  registryAction: string;
  packets: Array<{ path: string; action: string; reason: string; result?: JsonObject }>;
}

export async function runImporter(options: RunImporterOptions): Promise<ImportReport> {
  const validators = await createValidators(defaultSchemaPaths(options.repoRoot));
  const snapshot = await loadEffectiveSnapshot(options.git, options.commitSha, validators);
  const registries = snapshot.registries;
  const identityChecksum = registryChecksum(registries);
  const packetPaths = await selectPacketPaths(options);
  const revision = await diagnosticRevision(options.git, options.commitSha);
  const plans: Array<{
    path: string;
    raw: Uint8Array;
    payload: JsonObject;
    rawChecksum: string;
    projectionChecksum: string;
    cursorSha: string | null;
    action: string;
    reason: string;
  }> = [];

  for (const packetPath of packetPaths) {
    const archived = snapshot.packets.get(packetPath);
    if (archived === undefined) throw new Error(`Packet is not present in the archive snapshot: ${packetPath}`);
    const { raw, packet } = archived;
    validatePacketIdentities(packet, registries);
    const projected = projectDailyPacket(packet, registries);
    const rawHash = rawChecksum(raw);
    const projectionHash = projectionInputChecksum(rawHash, identityChecksum, options.mapperVersion ?? MAPPER_VERSION);
    const cursor = options.rpc === undefined ? null : await getSyncCursor(options.rpc, packetPath);
    const decision = await classifyRevision(options.git, cursor?.authoritative_commit_sha ?? null, options.commitSha, options.remoteMainSha);
    if (decision.action === "fail") throw new Error(`Unsafe Git history for ${packetPath}: ${decision.reason}`);
    plans.push({
      path: packetPath,
      raw,
      payload: projected,
      rawChecksum: rawHash,
      projectionChecksum: projectionHash,
      cursorSha: cursor?.authoritative_commit_sha ?? null,
      action: decision.action,
      reason: decision.reason,
    });
  }

  let registryAction = "dry_run";
  let registrySuperseded = false;
  if (options.rpc !== undefined) {
    const state = await getIdentityRegistryState(options.rpc);
    const registryDecision = await classifyRevision(
      options.git,
      state?.source_commit_sha ?? null,
      options.commitSha,
      options.remoteMainSha,
    );
    if (registryDecision.action === "fail") throw new Error(`Unsafe identity registry history: ${registryDecision.reason}`);
    if (registryDecision.reason === "same_sha" && state?.registry_checksum !== identityChecksum) {
      throw new Error("Identity registry checksum changed without a Git commit change");
    }
    registryAction = `${registryDecision.action}:${registryDecision.reason}`;
    registrySuperseded = registryDecision.reason === "stale_ancestor";
    if (options.mode !== "dry-run" && registryDecision.action === "apply") {
      if (state !== null) {
        const previousSnapshot = await loadEffectiveSnapshot(options.git, state.source_commit_sha, validators);
        validateRegistryTransition(previousSnapshot.registries, registries);
      }
      await applyIdentityRegistry(options.rpc, {
        events: registries.events,
        sources: registries.sources,
        commitSha: options.commitSha,
        checksum: identityChecksum,
        expectedCommitSha: state?.source_commit_sha ?? null,
        expectedChecksum: state?.registry_checksum ?? null,
      });
    }
  }

  const report: ImportReport = {
    mode: options.mode,
    commitSha: options.commitSha,
    registryChecksum: identityChecksum,
    registryAction,
    packets: [],
  };
  if (registrySuperseded) {
    report.packets = plans.map((plan) => ({
      path: plan.path,
      action: "skip",
      reason: "registry_state_is_newer",
    }));
    return report;
  }
  for (const plan of plans) {
    if (plan.action === "skip" || options.mode === "dry-run" || options.rpc === undefined) {
      report.packets.push({ path: plan.path, action: options.mode === "dry-run" ? "dry_run" : plan.action, reason: plan.reason });
      continue;
    }
    const result = await importDailyPacket(options.rpc, {
      packetPath: plan.path,
      payload: plan.payload,
      commitSha: options.commitSha,
      expectedCursorSha: plan.cursorSha,
      revision,
      rawChecksum: plan.rawChecksum,
      registryChecksum: identityChecksum,
      projectionChecksum: plan.projectionChecksum,
    });
    report.packets.push({ path: plan.path, action: "applied", reason: plan.reason, result });
  }
  return report;
}

async function loadEffectiveSnapshot(
  git: GitRunner,
  commitSha: string,
  validators: Awaited<ReturnType<typeof createValidators>>,
): Promise<{
  registries: IdentityRegistries;
  packets: Map<string, { raw: Uint8Array; packet: DailyPacket }>;
}> {
  const [rawEvents, rawSources, archivePaths] = await Promise.all([
    showFileAtCommit(git, commitSha, "data/identity/event-aliases.json"),
    showFileAtCommit(git, commitSha, "data/identity/source-aliases.json"),
    listArchivePaths(git, commitSha),
  ]);
  const explicit = await parseRegistries(rawEvents, rawSources, validators);
  const packets = new Map<string, { raw: Uint8Array; packet: DailyPacket }>();
  for (const packetPath of archivePaths) {
    const raw = await showFileAtCommit(git, commitSha, packetPath);
    packets.set(packetPath, { raw, packet: await parseDailyPacket(raw, validators.daily) });
  }
  const registries = buildEffectiveRegistries(
    explicit,
    [...packets.values()].map((entry) => entry.packet),
    commitSha,
  );
  return { registries, packets };
}

async function selectPacketPaths(options: RunImporterOptions): Promise<string[]> {
  if (options.packetPaths !== undefined && options.packetPaths.length > 0) {
    return [...new Set(options.packetPaths)].sort();
  }
  if (options.mode === "backfill" || options.mode === "dry-run") {
    return listArchivePaths(options.git, options.commitSha);
  }
  const changed = await changedProjectionPaths(options.git, options.commitSha);
  return changed.identityChanged ? listArchivePaths(options.git, options.commitSha) : changed.packets;
}

export function identityRegistriesForTesting(value: IdentityRegistries): IdentityRegistries {
  return value;
}
