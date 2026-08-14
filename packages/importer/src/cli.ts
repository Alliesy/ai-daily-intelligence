#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { GitCliRunner } from "./git.js";
import { type ImportMode, runImporter } from "./importer.js";
import { HttpRpcClient } from "./rpc.js";

interface CliOptions {
  mode: ImportMode;
  repoRoot: string;
  commitSha: string;
  remoteMainSha: string;
  packetPaths: string[];
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const rpc = url && serviceRoleKey ? new HttpRpcClient(url, serviceRoleKey) : undefined;
  if (options.mode !== "dry-run" && rpc === undefined) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required outside dry-run mode");
  }
  const report = await runImporter({
    ...options,
    git: new GitCliRunner(options.repoRoot),
    rpc,
    packetPaths: options.packetPaths.length > 0 ? options.packetPaths : undefined,
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

function parseArgs(args: string[]): CliOptions {
  let mode: ImportMode | undefined;
  let repoRoot = process.cwd();
  let commitSha: string | undefined;
  let remoteMainSha: string | undefined;
  const packetPaths: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const value = args[index + 1];
    if (arg === "--mode" && isMode(value)) { mode = value; index += 1; continue; }
    if (arg === "--repo-root" && value) { repoRoot = path.resolve(value); index += 1; continue; }
    if (arg === "--commit" && value) { commitSha = value; index += 1; continue; }
    if (arg === "--remote-main" && value) { remoteMainSha = value; index += 1; continue; }
    if (arg === "--packet" && value) { packetPaths.push(value); index += 1; continue; }
    throw new Error(`Unknown or incomplete argument: ${arg ?? "<missing>"}`);
  }
  if (mode === undefined || commitSha === undefined || remoteMainSha === undefined) {
    throw new Error("Usage: ai-daily-import --mode incremental|backfill|dry-run --commit <sha> --remote-main <sha> [--repo-root <path>] [--packet <path>]...");
  }
  return { mode, repoRoot, commitSha, remoteMainSha, packetPaths };
}

function isMode(value: string | undefined): value is ImportMode {
  return value === "incremental" || value === "backfill" || value === "dry-run";
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
