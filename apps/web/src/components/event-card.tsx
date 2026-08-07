import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EventDto } from "@/lib/content";

const importanceStyle = { S: "border-rose-200 bg-rose-50 text-rose-700", A: "border-amber-200 bg-amber-50 text-amber-700", B: "border-sky-200 bg-sky-50 text-sky-700" } as const;

export function EventCard({ event, rank }: { event: EventDto; rank: number }) {
  return <article className="group grid gap-4 border-t border-slate-200 py-6 first:border-t-0 sm:grid-cols-[3rem_1fr_auto]"><span className="hidden font-mono text-sm text-slate-400 sm:block">{String(rank).padStart(2, "0")}</span><div className="min-w-0"><div className="mb-3 flex flex-wrap items-center gap-2"><Badge className={importanceStyle[event.importance]}>{event.importance} 중요도</Badge>{event.topics.slice(0, 2).map((topic) => <Badge key={topic}>{topic}</Badge>)}</div><h3 className="text-balance text-xl font-extrabold leading-snug tracking-tight text-slate-950 sm:text-2xl"><Link href={`/events/${event.slug}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">{event.title}</Link></h3><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{event.oneLineSummary}</p><p className="mt-4 text-xs font-semibold text-slate-500">{event.sources.length}개 출처 · {event.sources.some((source) => source.authority === "official") ? "공식 출처 포함" : "독립 출처 기반"}</p></div><Link href={`/events/${event.slug}`} aria-label={`${event.title} 상세 보기`} className="hidden size-10 place-items-center self-center rounded-full border border-slate-200 text-slate-500 transition group-hover:border-sky-300 group-hover:bg-sky-50 group-hover:text-sky-700 sm:grid"><ArrowUpRight className="size-4" aria-hidden /></Link></article>;
}

