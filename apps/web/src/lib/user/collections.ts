import "server-only";

import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;
export interface SavedEventDto { id: string; slug: string; title: string; summary: string; importance: "S" | "A" | "B"; }
export interface FollowedTopicDto { id: string; slug: string; name: string; }
export type CollectionsDto = { status: "unconfigured" | "signed_out" } | { status: "signed_in"; bookmarked: SavedEventDto[]; interested: SavedEventDto[]; topics: FollowedTopicDto[] };

function eventFrom(value: unknown): SavedEventDto | null {
  const row = (Array.isArray(value) ? value[0] : value) as Row | null;
  if (!row || typeof row.id !== "string" || typeof row.slug !== "string") return null;
  return { id: row.id, slug: row.slug, title: typeof row.title_ko === "string" ? row.title_ko : String(row.title_original ?? "제목 없음"), summary: String(row.one_line_summary_ko ?? ""), importance: (["S", "A", "B"].includes(String(row.importance)) ? row.importance : "B") as SavedEventDto["importance"] };
}

export async function getUserCollections(): Promise<CollectionsDto> {
  if (!getSupabasePublicConfig()) return { status: "unconfigured" };
  const client = await createSupabaseServerClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return { status: "signed_out" };
  const [bookmarks, reactions, follows] = await Promise.all([
    client.from("bookmarks").select("created_at,events(id,slug,title_ko,title_original,one_line_summary_ko,importance)").eq("user_id", auth.user.id).order("created_at", { ascending: false }),
    client.from("reactions").select("updated_at,events(id,slug,title_ko,title_original,one_line_summary_ko,importance)").eq("user_id", auth.user.id).eq("interested", true).order("updated_at", { ascending: false }),
    client.from("follows").select("created_at,topics(id,slug,name_ko)").eq("user_id", auth.user.id).order("created_at", { ascending: false }),
  ]);
  if (bookmarks.error || reactions.error || follows.error) throw bookmarks.error ?? reactions.error ?? follows.error;
  return {
    status: "signed_in",
    bookmarked: (bookmarks.data ?? []).map((row) => eventFrom(row.events)).filter((event): event is SavedEventDto => Boolean(event)),
    interested: (reactions.data ?? []).map((row) => eventFrom(row.events)).filter((event): event is SavedEventDto => Boolean(event)),
    topics: (follows.data ?? []).flatMap((row) => { const topic = (Array.isArray(row.topics) ? row.topics[0] : row.topics) as unknown as Row | null; return topic && typeof topic.id === "string" ? [{ id: topic.id, slug: String(topic.slug), name: String(topic.name_ko) }] : []; }),
  };
}
