/* eslint-disable @next/next/no-img-element -- hero images use verified, dynamically sourced URLs with attribution. */
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ExternalLink, Lightbulb } from "lucide-react";
import { EventActions } from "@/components/event-actions";
import { TopicFollow } from "@/components/topic-follow";
import { ShareButton } from "@/components/share-button";
import { SourceCard } from "@/components/source-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEventRoute, getEventSlugs } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };
export async function generateStaticParams() { return (await getEventSlugs()).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const route = await getEventRoute((await params).slug);
  return route?.kind === "event" ? { title: route.event.title, description: route.event.oneLineSummary } : { title: "Event를 찾을 수 없습니다" };
}

const blocks = [["FACT", "확인된 사실", "fact"], ["INTERPRETATION", "해석", "interpretation"], ["SIGNAL", "관찰할 신호", "signal"], ["SPECULATION", "추정", "speculation"]] as const;

export default async function EventDetailPage({ params }: Props) {
  const route = await getEventRoute((await params).slug);
  if (!route) notFound();
  if (route.kind === "redirect") permanentRedirect(`/events/${route.slug}`);
  const event = route.event;
  const primary = event.sources.find((source) => source.isPrimary) ?? event.sources[0];
  return <main className="bg-white"><article>
    <header className="border-b border-slate-200 bg-[#f8fafc]"><div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="flex flex-wrap gap-2"><Badge className="border-rose-200 bg-rose-50 text-rose-700">{event.importance} 중요도</Badge>{event.topics.map((topic) => <Badge key={topic}>{topic}</Badge>)}</div>
      <h1 className="mt-6 text-balance text-3xl font-black leading-tight tracking-[-0.035em] sm:text-5xl">{event.title}</h1><p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">{event.oneLineSummary}</p>
      <div className="mt-8 flex flex-wrap gap-3">{primary && <Button variant="accent" size="lg" asChild><a href={primary.url} target="_blank" rel="noopener noreferrer">원문 보기<ExternalLink aria-hidden /></a></Button>}<ShareButton title={event.title} /></div>
    </div></header>
    {event.heroImageUrl && <figure className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 lg:px-8"><div className="aspect-[16/7] overflow-hidden rounded-3xl bg-slate-100"><img src={event.heroImageUrl} alt={event.title} className="size-full object-cover" /></div>{event.heroImageAttribution && <figcaption className="mt-2 text-xs text-slate-500">이미지: {event.heroImageAttribution}</figcaption>}</figure>}
    <div className="mx-auto grid max-w-5xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:px-8"><div className="min-w-0">
      <section aria-labelledby="analysis"><p className="section-kicker">EVENT ANALYSIS</p><h2 id="analysis" className="section-title">사건을 네 층으로 읽기</h2><div className="mt-8 space-y-3">{blocks.map(([code, label, key]) => event[key] && <div key={code} className="grid gap-3 rounded-2xl border border-slate-200 p-5 sm:grid-cols-[9rem_1fr]"><div><p className="text-[11px] font-black tracking-[0.12em] text-sky-700">{code}</p><h3 className="mt-1 font-bold">{label}</h3></div><p className="leading-7 text-slate-700">{event[key]}</p></div>)}</div></section>
      <section className="mt-14 grid gap-5 sm:grid-cols-2"><div className="rounded-2xl bg-sky-50 p-6"><h2 className="font-black text-sky-950">왜 중요한가</h2><p className="mt-3 leading-7 text-sky-950/75">{event.whyItMatters}</p></div><div className="rounded-2xl bg-violet-50 p-6"><h2 className="font-black text-violet-950">전망</h2><p className="mt-3 leading-7 text-violet-950/75">{event.outlook}</p></div></section>
      {event.businessOpportunity && <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-6"><h2 className="flex items-center gap-2 font-black text-emerald-950"><Lightbulb aria-hidden />관련 사업 기회</h2><p className="mt-3 leading-7 text-emerald-950/75">{event.businessOpportunity}</p></section>}
    </div><aside><div className="sticky top-28 rounded-2xl border border-slate-200 p-4"><p className="mb-3 text-xs font-black tracking-[0.12em] text-slate-500">MY SIGNAL</p><EventActions eventId={event.id} returnPath={`/events/${event.slug}`} /></div><TopicFollow names={event.topics} returnPath={`/events/${event.slug}`} />{event.entities.length > 0 && <div className="mt-6"><p className="text-xs font-bold text-slate-500">RELATED ENTITIES</p><div className="mt-2 flex flex-wrap gap-2">{event.entities.map((entity) => <Badge key={entity}>{entity}</Badge>)}</div></div>}</aside></div>
    <section className="border-t border-slate-200 bg-[#f8fafc]"><div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8"><p className="section-kicker">SOURCES · {event.sources.length}</p><h2 className="section-title">이 Event의 모든 원본 자료</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">출처 성격과 검증 상태는 분리해 표시합니다. 사용자 반응은 사실 신뢰도에 영향을 주지 않습니다.</p><div className="mt-8 space-y-4">{event.sources.map((source) => <SourceCard key={source.id} source={source} />)}</div></div></section>
  </article></main>;
}
