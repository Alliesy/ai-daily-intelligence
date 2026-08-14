import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EventDto } from "@/lib/content";

const importanceStyle = { S: "border-rose-200 bg-rose-50 text-rose-700", A: "border-amber-200 bg-amber-50 text-amber-700", B: "border-sky-200 bg-sky-50 text-sky-700" } as const;

export function EventCard({ event, rank }: { event: EventDto; rank: number }) {
  return <article className="group grid gap-3 border-t border-slate-200 py-5 first:border-t-0 sm:grid-cols-[2.5rem_1fr_auto]"><span className="hidden font-mono text-xs text-slate-400 sm:block">{String(rank).padStart(2, "0")}</span><div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-1.5"><Badge className={importanceStyle[event.importance]}>{event.importance} 중요도</Badge>{event.topics.slice(0, 2).map((topic) => <Badge key={topic}>{topic}</Badge>)}</div><h3 className="text-balance text-[1.08rem] font-extrabold leading-snug tracking-[-0.02em] text-slate-950 sm:text-xl"><Link href={`/events/${event.slug}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">{event.title}</Link></h3>{event.oneLineSummary && <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-600">{event.oneLineSummary}</p>}<p className="mt-2.5 text-[11px] font-semibold text-slate-500">{event.sources.length}개 출처 · {event.sources.some((source) => source.authority === "official") ? "공식 출처 포함" : "독립 출처 기반"}</p></div><Link href={`/events/${event.slug}`} aria-label={`${event.title} 상세 보기`} className="hidden size-8 place-items-center self-center rounded-full border border-slate-200 text-slate-500 transition group-hover:border-blue-300 group-hover:bg-blue-50 group-hover:text-blue-700 sm:grid"><ArrowUpRight className="size-3.5" aria-hidden /></Link></article>;
}
