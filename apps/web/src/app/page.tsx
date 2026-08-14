/* eslint-disable @next/next/no-img-element -- hero images use verified, dynamically sourced URLs with attribution. */
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  ExternalLink,
  FileText,
  Flame,
  Lightbulb,
  Radar,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { EventActions } from "@/components/event-actions";
import { Badge } from "@/components/ui/badge";
import { getLatestBriefing } from "@/lib/content";
import type { EventDto, ResourceDto } from "@/lib/content";
import type { Importance } from "@/lib/content/types";

const importanceStyle: Record<Importance, string> = {
  S: "border-rose-200 bg-rose-50 text-rose-700",
  A: "border-amber-200 bg-amber-50 text-amber-700",
  B: "border-sky-200 bg-sky-50 text-sky-700",
};

function koreanDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(`${value}T00:00:00+09:00`));
}

function updateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(date);
}

function primarySource(event: EventDto) {
  return event.sources.find((source) => source.isPrimary) ?? event.sources[0] ?? null;
}

function EventMeta({ event }: { event: EventDto }) {
  const source = primarySource(event);
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
      {source && <span className="font-semibold text-slate-600">{source.publisher}</span>}
      {source && <span aria-hidden>·</span>}
      <span>{event.sources.length}개 출처</span>
      {event.topics[0] && <><span aria-hidden>·</span><span>{event.topics[0]}</span></>}
    </div>
  );
}

function LeadEvent({ event }: { event: EventDto }) {
  const detailPath = `/events/${event.slug}`;
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className={event.heroImageUrl ? "grid lg:grid-cols-[0.92fr_1.48fr]" : ""}>
        {event.heroImageUrl && (
          <Link href={detailPath} className="block min-h-52 overflow-hidden bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600">
            <img src={event.heroImageUrl} alt="" className="size-full min-h-52 object-cover transition duration-300 hover:scale-[1.015]" />
          </Link>
        )}
        <div className="flex min-h-[238px] flex-col p-4 sm:p-5 lg:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={importanceStyle[event.importance]}>{event.importance} 중요</Badge>
            {event.topics.slice(0, 2).map((topic) => <span key={topic} className="text-[11px] font-semibold text-slate-500">{topic}</span>)}
          </div>
          <h3 className="mt-3 text-balance text-[1.35rem] font-black leading-[1.32] tracking-[-0.035em] text-slate-950 sm:text-[1.65rem]">
            <Link href={detailPath} className="hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">{event.title}</Link>
          </h3>
          {event.oneLineSummary && <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 sm:text-[15px]">{event.oneLineSummary}</p>}
          <div className="mt-auto pt-5"><EventMeta event={event} /></div>
        </div>
      </div>
      <div className="border-t border-slate-200 p-2.5 sm:px-4">
        <EventActions eventId={event.id} returnPath="/" sharePath={detailPath} view="compact" />
      </div>
    </article>
  );
}

function SecondaryEvent({ event }: { event: EventDto }) {
  const detailPath = `/events/${event.slug}`;
  return (
    <article className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-200 py-3.5 last:border-b-0">
      <div className="min-w-0">
        <div className="mb-1.5 flex items-center gap-2">
          <Badge className={importanceStyle[event.importance]}>{event.importance}</Badge>
          {event.topics[0] && <span className="truncate text-[10px] font-semibold text-slate-500">{event.topics[0]}</span>}
        </div>
        <h3 className="line-clamp-2 text-[13px] font-extrabold leading-[1.45] tracking-[-0.015em] text-slate-950 sm:text-sm">
          <Link href={detailPath} className="group-hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">{event.title}</Link>
        </h3>
        <div className="mt-1.5"><EventMeta event={event} /></div>
      </div>
      {event.heroImageUrl ? (
        <Link href={detailPath} className="size-[74px] overflow-hidden rounded-md bg-slate-100 sm:size-[92px]">
          <img src={event.heroImageUrl} alt="" className="size-full object-cover" />
        </Link>
      ) : <ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700" aria-hidden />}
    </article>
  );
}

function ResourceRow({ resource }: { resource: ResourceDto }) {
  return (
    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="group grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-slate-200 py-3 last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
      <div className="min-w-0">
        <div className="flex items-center gap-2"><Badge>{resource.type.replaceAll("_", " ")}</Badge>{resource.stars !== null && <span className="text-[10px] text-slate-500">★ {resource.stars.toLocaleString()}</span>}</div>
        <h3 className="mt-1.5 truncate text-sm font-bold text-slate-900 group-hover:text-blue-700">{resource.title}</h3>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{resource.whyRelevant}</p>
      </div>
      <ExternalLink className="mt-1 size-3.5 text-slate-400" aria-hidden />
    </a>
  );
}

export default async function TodayPage() {
  const briefing = await getLatestBriefing();
  if (!briefing) return <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-20 sm:px-6 lg:px-8"><h1 className="text-3xl font-black">아직 공개된 브리핑이 없습니다.</h1></main>;

  const lead = briefing.events[0] ?? null;
  const secondary = briefing.events.slice(1, 5);
  const sourceCount = briefing.events.reduce((count, event) => count + event.sources.length, 0);
  const uniqueResources = [...new Map(briefing.resources.map((resource) => [resource.url || resource.id, resource])).values()];
  const time = updateTime(briefing.generatedAt);
  const metrics = [
    { label: "핵심 뉴스", value: briefing.events.length, icon: Flame, tone: "text-orange-500 bg-orange-50" },
    { label: "트렌드 시그널", value: briefing.trends.length, icon: TrendingUp, tone: "text-indigo-600 bg-indigo-50" },
    { label: "사업 기회", value: briefing.opportunities.length, icon: Lightbulb, tone: "text-emerald-600 bg-emerald-50" },
    { label: "신규 자료", value: uniqueResources.length, icon: FileText, tone: "text-blue-600 bg-blue-50" },
  ];

  return (
    <main className="bg-white pb-5 md:pb-0">
      <section className="border-b border-slate-200">
        <div className="mx-auto grid max-w-[1320px] gap-6 px-4 py-6 sm:px-6 md:py-8 lg:grid-cols-[0.9fr_1.45fr] lg:items-center lg:gap-12 lg:px-8">
          <div className="rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50/80 to-slate-50 p-4 sm:border-0 sm:bg-none sm:p-0">
            <p className="text-[11px] font-semibold text-slate-600">{koreanDate(briefing.dateKst)}</p>
            <h1 className="mt-2 text-[1.45rem] font-black tracking-[-0.035em] text-slate-950 sm:text-[1.7rem]">오늘의 인사이트</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-700">{briefing.todaysInsight}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
              <span>핵심 Event {briefing.events.length}건</span><span aria-hidden>·</span><span>관련 Source {sourceCount}건</span>{time && <><span aria-hidden>·</span><span>{time} 업데이트</span></>}
            </div>
            {briefing.status === "partial" && <p role="status" className="mt-3 border-t border-amber-200 pt-2 text-[11px] leading-5 text-amber-800">일부 자료는 수집 또는 검증 중입니다. 확인된 내용부터 공개합니다.</p>}
          </div>
          <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white md:grid md:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="relative flex min-h-36 flex-col items-center justify-center border-r border-slate-200 px-3 text-center last:border-r-0">
                <span className={`grid size-8 place-items-center rounded-lg ${tone}`}><Icon className="size-4" aria-hidden /></span>
                <span className="mt-2 text-xs font-bold text-slate-700">{label}</span>
                <strong className="mt-1 text-2xl font-black tabular-nums text-slate-950">{value}</strong>
                <span className="mt-1 text-[10px] text-slate-400">오늘 브리핑</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <section id="top-news" aria-labelledby="top-news-heading" className="scroll-mt-20 py-7 md:py-9">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="top-news-heading" className="text-xl font-black tracking-[-0.025em] text-slate-950 sm:text-2xl">핵심 뉴스</h2>
            <span className="text-xs font-semibold text-slate-500">{briefing.events.length}개 Event</span>
          </div>
          {lead ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.62fr)_minmax(18rem,0.88fr)]">
              <LeadEvent event={lead} />
              <div className="border-t border-slate-200 lg:border-t-0">{secondary.map((event) => <SecondaryEvent key={event.id} event={event} />)}</div>
            </div>
          ) : <p className="border-y border-slate-200 py-8 text-sm text-slate-500">오늘 공개된 핵심 Event가 없습니다.</p>}
        </section>

        <div className="grid border-t border-slate-200 pb-7 pt-7 md:gap-7 lg:grid-cols-3 lg:pb-9">
          <section aria-labelledby="opportunity-heading" className="border-b border-slate-200 pb-7 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="opportunity-heading" className="flex items-center gap-2 text-lg font-black tracking-[-0.025em]"><Radar className="size-[18px] text-blue-600" aria-hidden />사업 기회 레이더</h2>
              <Link href="/opportunities" className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-blue-700">더보기<ArrowRight className="size-3" aria-hidden /></Link>
            </div>
            <div className="divide-y divide-slate-200 rounded-md border border-slate-200">
              {briefing.opportunities.slice(0, 5).map((idea) => (
                <article key={idea.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-3">
                  <div className="min-w-0"><h3 className="truncate text-sm font-bold text-slate-900">{idea.name}</h3><p className="mt-1 truncate text-[11px] text-slate-500">{idea.potential}{idea.difficulty && ` · ${idea.difficulty}`}</p></div>
                  <span className="self-center rounded bg-violet-50 px-2 py-1 text-xs font-black tabular-nums text-violet-700">{idea.score.toFixed(1)}</span>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="trending-heading" className="border-b border-slate-200 py-7 lg:border-b-0 lg:border-r lg:px-7 lg:py-0">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="trending-heading" className="flex items-center gap-2 text-lg font-black tracking-[-0.025em]"><TrendingUp className="size-[18px] text-indigo-600" aria-hidden />트렌딩 시그널</h2>
              <Link href="/trends" className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-blue-700">7일·30일<ArrowRight className="size-3" aria-hidden /></Link>
            </div>
            <ol className="divide-y divide-slate-200 border-y border-slate-200">
              {briefing.trends.slice(0, 5).map((trend, index) => (
                <li key={trend.id} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 py-3">
                  <span className="font-mono text-xs font-bold text-slate-400">{index + 1}</span>
                  <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-slate-900">{trend.label}</h3>{trend.mood && <span className="text-[10px] text-indigo-600">{trend.mood}</span>}</div><p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-500">{trend.summary}</p></div>
                </li>
              ))}
            </ol>
          </section>

          <section id="resources" aria-labelledby="resources-heading" className="scroll-mt-20 pt-7 lg:pl-7 lg:pt-0">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="resources-heading" className="flex items-center gap-2 text-lg font-black tracking-[-0.025em]"><BookOpenText className="size-[18px] text-blue-600" aria-hidden />도구 / 오픈소스 / 논문</h2>
              <a href="#resources-list" className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-blue-700">전체 {uniqueResources.length}<ArrowRight className="size-3" aria-hidden /></a>
            </div>
            <div id="resources-list" className="border-y border-slate-200">{uniqueResources.slice(0, 5).map((resource) => <ResourceRow key={resource.id} resource={resource} />)}</div>
          </section>
        </div>

        <div className="mb-5 flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-1.5"><Sparkles className="size-3.5" aria-hidden />AI Daily Intelligence는 중요한 변화와 기회를 선별해 제공합니다.</span>
          <span>{koreanDate(briefing.dateKst)}{time ? ` ${time} KST 업데이트` : ""}</span>
        </div>
      </div>
    </main>
  );
}
