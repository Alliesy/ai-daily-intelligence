"use client";

import { Bookmark, Heart, Share2, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Sentiment = "like" | "dislike" | null;
const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));

export function EventActions({ eventId, returnPath }: { eventId: string; returnPath: string }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment>(null);
  const [interested, setInterested] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    const client = createSupabaseBrowserClient();
    void client.auth.getUser().then(async ({ data }: Awaited<ReturnType<typeof client.auth.getUser>>) => {
      const id = data.user?.id ?? null; setUserId(id);
      if (!id) return;
      const [reaction, bookmark] = await Promise.all([
        client.from("reactions").select("sentiment,interested").eq("user_id", id).eq("event_id", eventId).maybeSingle(),
        client.from("bookmarks").select("event_id").eq("user_id", id).eq("event_id", eventId).maybeSingle(),
      ]);
      setSentiment((reaction.data?.sentiment as Sentiment) ?? null);
      setInterested(reaction.data?.interested === true);
      setBookmarked(Boolean(bookmark.data));
    });
  }, [eventId]);

  function requireLogin() { if (userId) return true; router.push(`/login?next=${encodeURIComponent(returnPath)}`); return false; }
  async function writeReaction(nextSentiment: Sentiment, nextInterested: boolean) {
    if (!requireLogin() || !userId) return;
    setPending(true); setMessage(null);
    const client = createSupabaseBrowserClient();
    const result = nextSentiment === null && !nextInterested
      ? await client.from("reactions").delete().eq("user_id", userId).eq("event_id", eventId)
      : await client.from("reactions").upsert({ user_id: userId, event_id: eventId, sentiment: nextSentiment, interested: nextInterested }, { onConflict: "user_id,event_id" });
    if (result.error) setMessage("반응을 저장하지 못했습니다."); else { setSentiment(nextSentiment); setInterested(nextInterested); }
    setPending(false);
  }
  async function toggleBookmark() {
    if (!requireLogin() || !userId) return;
    setPending(true); setMessage(null);
    const client = createSupabaseBrowserClient();
    const result = bookmarked ? await client.from("bookmarks").delete().eq("user_id", userId).eq("event_id", eventId) : await client.from("bookmarks").insert({ user_id: userId, event_id: eventId });
    if (result.error) setMessage("저장을 변경하지 못했습니다."); else setBookmarked(!bookmarked);
    setPending(false);
  }
  async function share() {
    const data = { title: document.title, url: window.location.href };
    if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(data.url); setMessage("링크를 복사했습니다."); }
  }
  return <div><div className="grid grid-cols-2 gap-2"><Button variant={sentiment === "like" ? "accent" : "outline"} size="sm" disabled={pending} onClick={() => writeReaction(sentiment === "like" ? null : "like", interested)}><ThumbsUp aria-hidden />좋아요</Button><Button variant={sentiment === "dislike" ? "default" : "outline"} size="sm" disabled={pending} onClick={() => writeReaction(sentiment === "dislike" ? null : "dislike", interested)}><ThumbsDown aria-hidden />싫어요</Button><Button variant={interested ? "accent" : "outline"} size="sm" disabled={pending} onClick={() => writeReaction(sentiment, !interested)}><Heart aria-hidden />관심</Button><Button variant={bookmarked ? "accent" : "outline"} size="sm" disabled={pending} onClick={toggleBookmark}><Bookmark aria-hidden />저장</Button></div><Button variant="ghost" size="sm" className="mt-2 w-full" onClick={share}><Share2 aria-hidden />공유</Button>{message && <p role="status" className="mt-2 text-xs text-slate-600">{message}</p>}<p className="mt-3 text-xs leading-5 text-slate-500">개인 기능을 사용할 때만 로그인하며, 사용자 반응은 사실 신뢰도에 영향을 주지 않습니다.</p></div>;
}
