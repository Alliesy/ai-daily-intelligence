"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
type Topic = { id: string; name_ko: string };

export function TopicFollow({ names, returnPath }: { names: string[]; returnPath: string }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(!configured);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!configured || !names.length) return;
    const client = createSupabaseBrowserClient();
    void Promise.all([client.auth.getUser(), client.from("topics").select("id,name_ko").in("name_ko", names)]).then(async ([auth, topicRows]) => {
      const id = auth.data.user?.id ?? null; setUserId(id); setTopics((topicRows.data ?? []) as Topic[]);
      if (!id) return;
      const topicIds = (topicRows.data ?? []).map((topic: Topic) => topic.id);
      if (!topicIds.length) return;
      const { data } = await client.from("follows").select("topic_id").eq("user_id", id).in("topic_id", topicIds);
      setFollowed(new Set((data ?? []).map((row: { topic_id: string }) => row.topic_id)));
    }).finally(() => setAuthResolved(true));
  }, [names]);
  if (!names.length) return null;
  async function toggle(topic: Topic) {
    if (!userId) { router.push(`/login?next=${encodeURIComponent(returnPath)}`); return; }
    if (!topic.id) return;
    const client = createSupabaseBrowserClient();
    const active = followed.has(topic.id);
    const result = active ? await client.from("follows").delete().eq("user_id", userId).eq("topic_id", topic.id) : await client.from("follows").insert({ user_id: userId, topic_id: topic.id });
    if (!result.error) setFollowed((current) => { const next = new Set(current); if (active) next.delete(topic.id); else next.add(topic.id); return next; });
  }
  return <div className="flex flex-wrap items-center gap-1.5"><p className="mr-1 text-xs font-bold text-slate-500">Topic Follow</p>{(topics.length ? topics : names.map((name) => ({ id: "", name_ko: name }))).map((topic) => <Button key={topic.id || topic.name_ko} variant={followed.has(topic.id) ? "default" : "outline"} size="sm" className="h-7 rounded-md px-2 text-[11px]" disabled={(configured && !authResolved) || Boolean(userId && !topic.id)} onClick={() => toggle(topic)}>{followed.has(topic.id) ? <X aria-hidden /> : <Plus aria-hidden />}{topic.name_ko}</Button>)}</div>;
}
