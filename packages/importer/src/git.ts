import { spawn } from "node:child_process";
import type { GitRunner, GitRunResult } from "./types.js";

const SHA_PATTERN = /^[0-9a-f]{40}$/;

export type RevisionDecision =
  | { action: "apply"; reason: "bootstrap" | "descendant" }
  | { action: "skip"; reason: "same_sha" | "stale_ancestor" }
  | { action: "fail"; reason: "diverged" | "incoming_not_on_remote_main" | "missing_history" };

export class GitCliRunner implements GitRunner {
  constructor(private readonly cwd: string) {}

  run(args: readonly string[]): Promise<GitRunResult> {
    return new Promise((resolve, reject) => {
      const child = spawn("git", [...args], { cwd: this.cwd, shell: false, windowsHide: true });
      let stdout = "";
      let stderr = "";
      child.stdout.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
      child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
      child.on("error", reject);
      child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
    });
  }
}

export async function classifyRevision(
  runner: GitRunner,
  storedSha: string | null,
  incomingSha: string,
  remoteMainSha: string,
): Promise<RevisionDecision> {
  assertSha(incomingSha, "incoming");
  assertSha(remoteMainSha, "remote main");
  if (storedSha !== null) assertSha(storedSha, "stored cursor");

  if (!await commitExists(runner, incomingSha) ||
      !await commitExists(runner, remoteMainSha) ||
      (storedSha !== null && !await commitExists(runner, storedSha))) {
    return { action: "fail", reason: "missing_history" };
  }
  if (!await isAncestor(runner, incomingSha, remoteMainSha)) {
    return { action: "fail", reason: "incoming_not_on_remote_main" };
  }
  if (storedSha === null) return { action: "apply", reason: "bootstrap" };
  if (storedSha === incomingSha) return { action: "skip", reason: "same_sha" };
  if (await isAncestor(runner, storedSha, incomingSha)) return { action: "apply", reason: "descendant" };
  if (await isAncestor(runner, incomingSha, storedSha)) return { action: "skip", reason: "stale_ancestor" };
  return { action: "fail", reason: "diverged" };
}

export async function diagnosticRevision(runner: GitRunner, sha: string): Promise<number> {
  assertSha(sha, "revision");
  const result = await runner.run(["rev-list", "--count", sha]);
  if (result.code !== 0 || !/^\d+$/.test(result.stdout.trim())) {
    throw new Error(`Unable to compute diagnostic Git revision: ${result.stderr.trim()}`);
  }
  return Number.parseInt(result.stdout.trim(), 10);
}

export async function showFileAtCommit(runner: GitRunner, sha: string, filePath: string): Promise<Uint8Array> {
  assertSha(sha, "snapshot");
  assertRepoRelativePath(filePath);
  const result = await runner.run(["show", `${sha}:${filePath}`]);
  if (result.code !== 0) throw new Error(`Unable to read ${filePath} at ${sha}: ${result.stderr.trim()}`);
  return Buffer.from(result.stdout, "utf8");
}

export async function listArchivePaths(runner: GitRunner, sha: string): Promise<string[]> {
  assertSha(sha, "snapshot");
  const result = await runner.run(["ls-tree", "-r", "--name-only", sha, "--", "data/daily"]);
  if (result.code !== 0) throw new Error(`Unable to list archive at ${sha}: ${result.stderr.trim()}`);
  return parsePacketPaths(result.stdout);
}

export async function changedProjectionPaths(runner: GitRunner, sha: string): Promise<{
  packets: string[];
  identityChanged: boolean;
}> {
  assertSha(sha, "snapshot");
  const result = await runner.run(["diff-tree", "--root", "--no-commit-id", "--name-only", "-r", sha, "--", "data/daily", "data/identity"]);
  if (result.code !== 0) throw new Error(`Unable to inspect changed paths at ${sha}: ${result.stderr.trim()}`);
  const paths = result.stdout.split(/\r?\n/).filter(Boolean);
  return {
    packets: parsePacketPaths(paths.join("\n")),
    identityChanged: paths.some((value) => value.startsWith("data/identity/")),
  };
}

async function commitExists(runner: GitRunner, sha: string): Promise<boolean> {
  const result = await runner.run(["cat-file", "-e", `${sha}^{commit}`]);
  if (result.code === 0) return true;
  if (result.code === 1 || result.code === 128) return false;
  throw new Error(`Unable to inspect Git commit ${sha}: ${result.stderr.trim()}`);
}

async function isAncestor(runner: GitRunner, ancestor: string, descendant: string): Promise<boolean> {
  const result = await runner.run(["merge-base", "--is-ancestor", ancestor, descendant]);
  if (result.code === 0) return true;
  if (result.code === 1) return false;
  throw new Error(`Unable to compare Git revisions: ${result.stderr.trim()}`);
}

function parsePacketPaths(output: string): string[] {
  return [...new Set(output.split(/\r?\n/)
    .filter((value) => /^data\/daily\/\d{4}\/\d{4}-\d{2}-\d{2}\.json$/.test(value)))]
    .sort();
}

function assertSha(value: string, label: string): void {
  if (!SHA_PATTERN.test(value)) throw new Error(`Invalid ${label} commit SHA`);
}

function assertRepoRelativePath(value: string): void {
  if (value.startsWith("/") || value.includes("\\") || value.split("/").includes("..")) {
    throw new Error(`Unsafe repository path: ${value}`);
  }
}
