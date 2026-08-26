/* eslint-disable @next/next/no-img-element -- all editorial images are verified source images with traceable attribution. */
import Link from "next/link";
import { ArrowRight, Building2, FileText, Globe2, ShieldCheck } from "lucide-react";
import { EventActions } from "@/components/event-actions";
import { VisitorMetadata } from "@/components/visitor-metadata";
import { buildMorningPaper } from "@/lib/content/morning-paper";
import type { BriefingDto, EventDto } from "@/lib/content";

function koreanDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", timeZone: "Asia/Seoul" })
    .format(new Date(`${value}T00:00:00+09:00`));
}

function updateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" }).format(date);
}

function primarySource(event: EventDto) {
  return event.sources.find((source) => source.isPrimary) ?? event.sources[0] ?? null;
}

function sourceTime(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" }).format(date);
}

function EventCard({ event, index, historicalDate, showImage }: { event: EventDto; index: number; historicalDate?: string; showImage: boolean }) {
  const source = primarySource(event);
  const href = `/events/${event.slug}`;
  return (
    <article className="morning-event-card">
      <div className="flex items-start justify-between gap-3">
        <span className="font-serif text-[1.2rem] font-semibold tabular-nums text-slate-950">{String(index + 1).padStart(2, "0")}</span>
        <div className="w-9"><EventActions eventId={event.id} returnPath={href} sharePath={href} view="bookmark" /></div>
      </div>
      {showImage && event.heroImageUrl ? (
        <Link href={href} className="mt-3 block aspect-[1.48/1] overflow-hidden rounded-sm bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900">
          <img src={event.heroImageUrl} alt="" className="size-full object-cover grayscale-[18%] transition duration-300 hover:scale-[1.015]" />
        </Link>
      ) : null}
      <p className="mt-3 text-xs text-stone-500">{historicalDate ? "당일 기록" : (source?.publisher ?? event.entities[0] ?? "AI Intelligence")}</p>
      <h3 className="mt-2 font-serif text-[1.14rem] font-semibold leading-[1.48] tracking-[-0.02em] text-stone-950">
        <Link href={href} className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900">{event.title}</Link>
      </h3>
      {event.oneLineSummary && <p className="mt-2 line-clamp-3 text-[13px] leading-6 text-stone-600">{event.oneLineSummary}</p>}
      <p className="mt-auto pt-4 text-[11px] text-stone-500">{historicalDate ?? sourceTime(source?.publishedAt ?? null) ?? "게시 시각 미상"} · {event.sources.length}개 출처{!historicalDate && event.topics[0] ? ` · ${event.topics[0]}` : ""}</p>
    </article>
  );
}

export function MorningPaper({ briefing, isArchive = false }: { briefing: BriefingDto; isArchive?: boolean }) {
  const paper = buildMorningPaper(briefing);
  const time = updateTime(briefing.generatedAt);
  const evidenceSourceCount = paper.evidence.events.flatMap((event) => event.sources).length;
  const opportunity = paper.opportunity;

  return (
    <main className="bg-[#fdfcf9] text-stone-950">
      <div className="mx-auto max-w-[1240px] px-5 pb-10 pt-8 sm:px-8 lg:px-10 lg:pt-14">
        {isArchive && <Link href="/archive" className="mb-7 inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-950">← 아카이브로 돌아가기</Link>}
        <section aria-labelledby="morning-headline" className="grid gap-8 border-b border-stone-300 pb-10 lg:grid-cols-[minmax(0,1.55fr)_19rem] lg:gap-16">
          <div>
            <p className="text-xs font-medium tracking-[0.02em] text-stone-600">{koreanDate(briefing.dateKst)}</p>
            <h1 id="morning-headline" className="mt-5 max-w-[820px] text-balance font-serif text-[2.15rem] font-semibold leading-[1.32] tracking-[-0.04em] sm:text-[3rem] lg:text-[3.45rem]">{paper.headline}</h1>
            {paper.summary && <p className="mt-6 max-w-3xl text-[15px] leading-7 text-stone-600 sm:text-base">{paper.summary}</p>}
            {!isArchive && <div aria-label="인사이트 근거와 방문자 통계" className="mt-6 border-t border-stone-200 pt-3 lg:hidden">
              <p className="text-[11px] font-medium text-stone-600">근거 {paper.evidence.eventCount}건 · 출처 {evidenceSourceCount}곳</p>
              <div className="flex flex-wrap items-center gap-x-2">
                <VisitorMetadata compact />
                {time && <span className="mt-1.5 text-[11px] text-stone-500">· {time} 업데이트</span>}
              </div>
            </div>}
          </div>
          <aside aria-label="인사이트 근거" className="hidden self-end border-l border-stone-300 pl-6 lg:block">
            <p className="text-xs font-semibold text-stone-800">이 인사이트의 근거</p>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2 text-stone-600"><FileText className="size-4" />근거 Event</dt><dd className="font-semibold">{paper.evidence.eventCount}건</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2 text-stone-600"><Globe2 className="size-4" />독립 근거군</dt><dd className="font-semibold">{paper.evidence.hasIndependentClassification ? `${paper.evidence.independentSourceCount}개` : "분류 전"}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2 text-stone-600"><Building2 className="size-4" />공식 출처</dt><dd className="font-semibold">{paper.evidence.officialSourceCount}개</dd></div>
            </dl>
            <p className="mt-6 text-[11px] text-stone-500">전체 연결 출처 {evidenceSourceCount}개</p>
            {!isArchive && <VisitorMetadata />}
            {time && <p className="mt-4 text-[11px] text-stone-500">업데이트 {time} KST</p>}
          </aside>
        </section>
        {briefing.status === "partial" && <p role="status" className="mt-5 border-l-2 border-amber-500 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">일부 자료는 수집 또는 검증 중입니다. 확인된 내용부터 공개합니다.</p>}
        <section id="top-news" aria-labelledby="top-news-heading" className="py-9 lg:py-11">
          <h2 id="top-news-heading" className="font-serif text-xl font-semibold tracking-[-0.02em]">오늘 꼭 볼 뉴스</h2>
          {paper.topEvents.length ? <div className="mt-5 grid gap-0 border-y border-stone-300 md:grid-cols-3">{paper.topEvents.map((event, index) => <EventCard key={event.id} event={event} index={index} historicalDate={isArchive ? briefing.dateKst : undefined} showImage={index === 0} />)}</div> : <p className="mt-5 border-y border-stone-300 py-8 text-sm text-stone-500">오늘의 엄격한 선정 기준을 통과한 Event가 없습니다.</p>}
        </section>
        <section aria-labelledby="opportunity-heading" className="border-t border-stone-300 pt-8">
          <div className="flex flex-wrap items-center gap-3"><h2 id="opportunity-heading" className="font-serif text-xl font-semibold">오늘의 기회</h2>{opportunity && <span className="rounded-full bg-[#f3ede3] px-3 py-1 text-[11px] font-semibold text-[#795f3f]">실행 가능성이 높은 1건</span>}</div>
          {opportunity ? (
            <Link href="/opportunities" className="mt-5 grid gap-5 rounded-md border border-[#e8dfd2] bg-[#fbf7f0] p-5 transition hover:border-[#bca98f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-6">
              <span className="grid size-14 place-items-center rounded-full border border-[#d8cab7] bg-[#f2e9dc]"><ShieldCheck className="size-6 text-[#7d6240]" /></span>
              <div><h3 className="font-serif text-xl font-semibold">{opportunity.name}</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">{opportunity.problem || opportunity.potential}</p><p className="mt-3 text-xs text-stone-500">{opportunity.customer}{opportunity.mvp ? ` · ${opportunity.mvp}` : ""}</p></div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold">자세히 <ArrowRight className="size-4" /></span>
            </Link>
          ) : <p className="mt-5 border border-stone-200 bg-white px-5 py-6 text-sm leading-6 text-stone-600">오늘은 현실성 검증 기준을 모두 통과한 사업 기회가 없습니다. 억지로 기회를 만들지 않습니다.</p>}
        </section>
        <div className="mt-10 flex flex-col gap-3 border-t border-stone-300 pt-5 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <span>전체 {briefing.events.length}건 수집 · Git archive 정본 · {koreanDate(briefing.dateKst)}</span>
          <Link href="/archive" className="inline-flex items-center gap-2 font-semibold text-stone-800 hover:underline">전체 브리핑 보기 <ArrowRight className="size-3.5" /></Link>
        </div>
      </div>
    </main>
  );
}
