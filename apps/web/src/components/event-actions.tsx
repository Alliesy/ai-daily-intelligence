"use client";

import { Bookmark, Heart, Share2, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Sentiment = "like" | "dislike" | null;
type ActionView = "detail" | "compact" | "bookmark";

const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
);

export function EventActions({
  eventId,
  returnPath,
  sharePath = returnPath,
  view = "detail",
}: {
  eventId: string;
  returnPath: string;
  sharePath?: string;
  view?: ActionView;
}) {
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
      const id = data.user?.id ?? null;
      setUserId(id);
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

  function requireLogin() {
    if (userId) return true;
    router.push(`/login?next=${encodeURIComponent(returnPath)}`);
    return false;
  }

  async function writeReaction(nextSentiment: Sentiment, nextInterested: boolean) {
    if (!requireLogin() || !userId) return;
    setPending(true);
    setMessage(null);
    const client = createSupabaseBrowserClient();
    const result = nextSentiment === null && !nextInterested
      ? await client.from("reactions").delete().eq("user_id", userId).eq("event_id", eventId)
      : await client.from("reactions").upsert(
          { user_id: userId, event_id: eventId, sentiment: nextSentiment, interested: nextInterested },
          { onConflict: "user_id,event_id" },
        );
    if (result.error) setMessage("반응을 저장하지 못했습니다.");
    else {
      setSentiment(nextSentiment);
      setInterested(nextInterested);
    }
    setPending(false);
  }

  async function toggleBookmark() {
    if (!requireLogin() || !userId) return;
    setPending(true);
    setMessage(null);
    const client = createSupabaseBrowserClient();
    const result = bookmarked
      ? await client.from("bookmarks").delete().eq("user_id", userId).eq("event_id", eventId)
      : await client.from("bookmarks").insert({ user_id: userId, event_id: eventId });
    if (result.error) setMessage("저장 상태를 변경하지 못했습니다.");
    else setBookmarked(!bookmarked);
    setPending(false);
  }

  async function share() {
    const data = { title: document.title, url: `${window.location.origin}${sharePath}` };
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(data.url);
      setMessage("링크를 복사했습니다.");
    }
  }

  const compact = view === "compact" || view === "bookmark";
  const allActions = [
    { label: "좋아요", icon: ThumbsUp, active: sentiment === "like", run: () => writeReaction(sentiment === "like" ? null : "like", interested) },
    { label: "싫어요", icon: ThumbsDown, active: sentiment === "dislike", run: () => writeReaction(sentiment === "dislike" ? null : "dislike", interested) },
    { label: "관심", icon: Heart, active: interested, run: () => writeReaction(sentiment, !interested) },
    { label: "저장", icon: Bookmark, active: bookmarked, run: toggleBookmark },
    { label: "공유", icon: Share2, active: false, run: share },
  ];
  const actions = view === "bookmark" ? allActions.filter((action) => action.label === "저장") : allActions;

  return (
    <div>
      <div className={cn(
        "grid divide-x divide-slate-200 overflow-hidden bg-white",
        view === "bookmark" ? "grid-cols-1 border-0" : "grid-cols-5 border border-slate-200",
        compact && view !== "bookmark" ? "rounded-md" : view === "detail" ? "rounded-lg" : "",
      )}>
        {actions.map(({ label, icon: Icon, active, run }) => (
          <Button
            key={label}
            type="button"
            aria-label={compact ? label : undefined}
            aria-pressed={active}
            title={compact ? label : undefined}
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-none px-1 text-[11px] text-slate-600 hover:text-blue-700",
              compact ? "h-9 gap-0" : "h-12 text-xs",
              active && "bg-blue-50 text-blue-700",
            )}
            disabled={pending}
            onClick={run}
          >
            <Icon className={compact ? "size-3.5" : undefined} aria-hidden />
            {!compact && label}
          </Button>
        ))}
      </div>
      {message && <p role="status" className="mt-2 text-xs text-slate-600">{message}</p>}
      <p className="sr-only">개인 기능은 사용할 때만 로그인을 요청하며, 사용자 반응은 사실 검증 상태에 영향을 주지 않습니다.</p>
    </div>
  );
}
