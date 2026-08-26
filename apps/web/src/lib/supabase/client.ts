"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabasePublicConfig } from "./config";

let client: SupabaseClient | undefined;

export function createSupabaseBrowserClient(): SupabaseClient {
  const { url, key } = requireSupabasePublicConfig();
  client ??= createBrowserClient(url, key);
  return client;
}
