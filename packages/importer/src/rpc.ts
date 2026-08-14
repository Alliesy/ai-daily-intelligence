import type { EventRegistry, JsonObject, RpcClient, SourceRegistry, SyncCursor } from "./types.js";

export interface IdentityRegistryState {
  source_commit_sha: string;
  registry_checksum: string;
  applied_at?: string;
}

export class RetryableSyncError extends Error {
  override readonly name = "RetryableSyncError";
}

export async function getSyncCursor(client: RpcClient, packetPath: string): Promise<SyncCursor | null> {
  return callRpc<SyncCursor | null>(client, "get_sync_cursor", { p_packet_path: packetPath });
}

export async function getIdentityRegistryState(client: RpcClient): Promise<IdentityRegistryState | null> {
  return callRpc<IdentityRegistryState | null>(client, "get_identity_registry_state", {});
}

export async function applyIdentityRegistry(
  client: RpcClient,
  input: {
    events: EventRegistry;
    sources: SourceRegistry;
    commitSha: string;
    checksum: string;
    expectedCommitSha: string | null;
    expectedChecksum: string | null;
  },
): Promise<JsonObject> {
  const result = await callRpc<JsonObject>(client, "apply_identity_registry", {
    p_event_registry: input.events,
    p_source_registry: input.sources,
    p_source_commit_sha: input.commitSha,
    p_registry_checksum: input.checksum,
    p_expected_registry_commit_sha: input.expectedCommitSha,
    p_expected_registry_checksum: input.expectedChecksum,
  });
  if (result.status === "retry_registry_changed") {
    throw new RetryableSyncError("Identity registry CAS changed; rerun from the current remote main snapshot");
  }
  return result;
}

export async function importDailyPacket(
  client: RpcClient,
  input: {
    packetPath: string;
    payload: JsonObject;
    commitSha: string;
    expectedCursorSha: string | null;
    revision: number;
    rawChecksum: string;
    registryChecksum: string;
    projectionChecksum: string;
  },
): Promise<JsonObject> {
  const result = await callRpc<JsonObject>(client, "import_daily_packet", {
    p_packet_path: input.packetPath,
    p_payload: input.payload,
    p_source_commit_sha: input.commitSha,
    p_expected_cursor_sha: input.expectedCursorSha,
    p_source_revision: input.revision,
    p_raw_checksum: input.rawChecksum,
    p_identity_registry_checksum: input.registryChecksum,
    p_projection_input_checksum: input.projectionChecksum,
  });
  if (result.status === "retry_cursor_changed") {
    throw new RetryableSyncError(`Cursor CAS changed for ${input.packetPath}; rerun against current state`);
  }
  return result;
}

export class HttpRpcClient implements RpcClient {
  constructor(private readonly url: string, private readonly serviceRoleKey: string) {
    if (!/^https:\/\//.test(url)) throw new Error("SUPABASE_URL must use HTTPS");
    if (serviceRoleKey.length < 20) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing or invalid");
  }

  async rpc<T>(functionName: string, parameters: Record<string, unknown>) {
    const response = await fetch(`${this.url.replace(/\/$/, "")}/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers: {
        apikey: this.serviceRoleKey,
        authorization: `Bearer ${this.serviceRoleKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(parameters),
    });
    const body = await response.json() as T | { message?: string; code?: string; details?: string; hint?: string };
    if (!response.ok) {
      const error = body as { message?: string; code?: string; details?: string; hint?: string };
      return { data: null, error: { message: error.message ?? `RPC ${functionName} failed`, ...error } };
    }
    return { data: body as T, error: null };
  }
}

async function callRpc<T>(client: RpcClient, functionName: string, parameters: Record<string, unknown>): Promise<T> {
  const result = await client.rpc<T>(functionName, parameters);
  if (result.error !== null) {
    throw new Error(`${functionName} failed${result.error.code ? ` (${result.error.code})` : ""}: ${result.error.message}`);
  }
  return result.data as T;
}
