/* eslint-disable @next/next/no-img-element -- hero images use verified, dynamically sourced URLs with attribution. */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ChevronRight, Clock3, ExternalLink, ShieldCheck } from "lucide-react";
import { AnalysisCards } from "@/components/analysis-cards";
import { EventActions } from "@/components/event-actions";
import { ReaderArticle } from "@/components/reader-article";
import { eventReaderHeader } from "@/lib/content/reader-v13";
import { ReaderCopy } from "@/components/reader-copy";
import { SourceList } from "@/components/source-list";
import { TopicFollow } from "@/components/topic-follow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEventRoute, getEventSlugs } from "@/lib/content";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
};
function archiveDate(value: string | string[] | undefined) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}
export async function generateStaticParams() { return (await getEventSlugs()).map((slug) => ({ slug })); }
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const route = await getEventRoute((await params).slug, archiveDate((await searchParams).date));
  if (route?.kind !== "event") return { title: "뉴스를 찾을 수 없습니다" };
  const copy = eventReaderHeader(route.event);
  return { title: copy.headline, description: copy.dek };
}

const importanceStyle = { S: "border-red-200 bg-red-50 text-red-700", A: "border-amber-200 bg-amber-50 text-amber-700", B: "border-blue-200 bg-blue-50 text-blue-700" } as const;
const verificationLabel = { verified: "검증됨", corroborated: "교차 확인", unverified: "미검증", disputed: "논쟁 중" } as const;

export default async function EventDetailPage({ params, searchParams }: Props) {
  const dateKst = archiveDate((await searchParams).date);
  const route = await getEventRoute((await params).slug, dateKst);
  if (!route) notFound();
  if (route.kind === "redirect") permanentRedirect(`/events/${route.slug}${dateKst ? `?date=${dateKst}` : ""}`);
  const event = route.event;
  const returnPath = `/events/${event.slug}${dateKst ? `?date=${dateKst}` : ""}`;
  const primary = event.sources.find((source) => source.isPrimary) ?? event.sources[0];
  const copy = eventReaderHeader(event);
  const readingWidth = event.reader ? "max-w-[52rem]" : "max-w-6xl";

  return <main className="bg-white"><article className="mx-auto max-w-[1440px]">
    <nav aria-label="현재 위치" className="mx-auto flex max-w-6xl items-center gap-1.5 px-4 py-4 text-xs text-slate-500 sm:px-6 lg:px-8"><Link href="/" className="hover:text-blue-700">홈</Link><ChevronRight className="size-3" aria-hidden /><span>뉴스</span><ChevronRight className="size-3" aria-hidden /><span className="text-slate-800">상세</span></nav>

    <header className={`mx-auto ${readingWidth} px-4 pb-5 sm:px-6 lg:px-8`}><div className={`grid gap-6 ${event.heroImageUrl ? "lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start" : ""}`}>
      <div className="min-w-0"><div className="flex flex-wrap gap-1.5"><Badge className={importanceStyle[event.importance]}>중요도 {event.importance}</Badge>{event.topics.slice(0, 3).map((topic, index) => <Badge key={topic} className={index === 0 ? "border-blue-100 bg-blue-50 text-blue-700" : "bg-slate-100"}>{topic}</Badge>)}</div>
        <h1 className="mt-4 font-serif text-balance text-[1.75rem] font-black leading-[1.25] tracking-[-0.03em] text-slate-950 sm:text-[2.1rem] lg:text-[2.25rem]">{copy.headline}</h1>
        {copy.dek && <p className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-600">{copy.dek}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">{primary && <span className="font-semibold text-slate-700">{primary.publisher}</span>}{(dateKst || primary?.publishedAt) && <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" aria-hidden />{dateKst ?? primary?.publishedAt?.slice(0, 10)}</span>}{primary && <span className={`inline-flex items-center gap-1 font-semibold ${primary.verificationStatus === "verified" ? "text-emerald-700" : "text-slate-500"}`}><ShieldCheck className="size-3.5" aria-hidden />{verificationLabel[primary.verificationStatus]}</span>}</div>
        {!event.heroImageUrl && primary && <Button variant="outline" size="sm" className="mt-5 rounded-md" asChild><a href={primary.url} target="_blank" rel="noopener noreferrer">원문에서 보기<ExternalLink aria-hidden /></a></Button>}
      </div>
      {event.heroImageUrl && <figure className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"><div className="aspect-[16/8.5] overflow-hidden"><img src={event.heroImageUrl} alt={copy.headline} className="size-full object-cover" /></div>{primary && <a href={primary.url} target="_blank" rel="noopener noreferrer" className="flex h-9 items-center justify-center gap-1 border-t border-slate-200 bg-white text-xs font-bold hover:bg-slate-50">원문에서 보기<ExternalLink className="size-3" aria-hidden /></a>}{event.heroImageAttribution && <figcaption className="sr-only">이미지: {event.heroImageAttribution}</figcaption>}</figure>}
    </div></header>

    <div className={`mx-auto ${readingWidth} px-4 sm:px-6 lg:px-8`}><EventActions eventId={event.id} returnPath={returnPath} /><div className="mt-3 flex flex-wrap items-start justify-between gap-3"><TopicFollow names={event.topics} returnPath={returnPath} />{event.entities.length > 0 && <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500"><span className="font-bold">관련 기업·기술</span>{event.entities.map((entity) => <Badge key={entity}>{entity}</Badge>)}</div>}</div></div>

    <div className={`mx-auto ${readingWidth} space-y-8 px-4 py-8 sm:px-6 lg:px-8`}>
      {event.reader ? <>
        <ReaderArticle reader={event.reader} />
        <details className="mx-auto max-w-[46rem] border-t border-stone-200 pt-5">
          <summary className="cursor-pointer text-sm font-semibold focus-visible:outline-2">AI 분석 더 보기</summary>
          <div className="mt-5 space-y-6"><AnalysisCards event={event} sectionNumber="" /><ReaderCopy event={event} /></div>
        </details>
      </> : <><ReaderCopy event={event} /><AnalysisCards event={event} sectionNumber="" /></>}
      <section aria-labelledby="sources-heading" className="detail-section"><div className="detail-heading"><h2 id="sources-heading">더 궁금하다면</h2><span className="content-mode">{event.sources.length}개 출처</span></div><p className="mt-2 text-xs leading-5 text-slate-500">공식 발표, 독립 보도와 분석 자료의 성격·검증 상태를 구분해 표시합니다. 외부 링크에서 원문 전체를 확인할 수 있습니다.</p><div className="mt-3"><SourceList sources={event.sources} /></div></section>
    </div>
  </article></main>;
}
