import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTrendOverview, type TrendMetricDto } from "@/lib/content";

type Props = { searchParams: Promise<{ window?: string | string[] }> };
export const metadata = { title: "Trends", description: "최근 7일·30일 AI Topic과 Entity 변화" };

export default async function TrendsPage({ searchParams }: Props) {
  const raw = (await searchParams).window;
  const window = (Array.isArray(raw) ? raw[0] : raw) === "30" ? 30 : 7;
  const overview = await getTrendOverview(window);
  return <main><header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8"><p className="section-kicker">TREND INTELLIGENCE</p><div className="mt-3 flex flex-wrap items-end justify-between gap-6"><div><h1 className="text-4xl font-black tracking-tight sm:text-5xl">신호의 방향을 읽기</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Briefing 등장 빈도를 기간 전·후반으로 비교합니다. 빈도는 중요도나 사실 신뢰도를 의미하지 않습니다.</p></div><div className="flex rounded-full border border-slate-200 bg-slate-50 p-1"><Link href="/trends?window=7" className={`rounded-full px-5 py-2 text-sm font-bold ${window === 7 ? "bg-slate-950 text-white" : "text-slate-600"}`}>7일</Link><Link href="/trends?window=30" className={`rounded-full px-5 py-2 text-sm font-bold ${window === 30 ? "bg-slate-950 text-white" : "text-slate-600"}`}>30일</Link></div></div>{overview && <p className="mt-6 text-xs font-semibold text-slate-500">분석 범위 {overview.from} — {overview.to}</p>}</div></header><div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">{overview ? <><div className="grid gap-8 lg:grid-cols-2"><MetricSection title="Topic 변화" items={overview.topics} empty="기간 내 Topic 데이터가 없습니다." /><MetricSection title="Entity 변화" items={overview.entities} empty="현재 archive에는 구조화된 Entity 데이터가 없습니다." /></div><section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"><p className="section-kicker"><Radio className="mr-2 inline size-4" aria-hidden />SIGNALS</p><h2 className="section-title">주요 커뮤니티·시장 신호</h2><div className="mt-6 grid gap-4 md:grid-cols-2">{overview.signals.map((signal) => <article key={signal.id} className="rounded-2xl bg-slate-50 p-5"><div className="flex items-center justify-between gap-3"><Badge>{signal.label}</Badge>{signal.mood && <span className="text-xs text-slate-500">{signal.mood}</span>}</div><p className="mt-4 text-sm leading-7 text-slate-700">{signal.summary}</p>{signal.sourceUrl && <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs font-bold text-sky-700">근거 보기</a>}</article>)}</div></section></> : <p className="rounded-2xl border border-slate-200 bg-white p-8">분석할 Briefing이 없습니다.</p>}</div></main>;
}
function MetricSection({ title, items, empty }: { title: string; items: TrendMetricDto[]; empty: string }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"><h2 className="text-2xl font-black">{title}</h2><div className="mt-6 space-y-3">{items.map((item, index) => <div key={item.label} className="grid grid-cols-[2rem_1fr_auto_auto] items-center gap-3 border-t border-slate-100 py-3 first:border-0"><span className="font-mono text-xs text-slate-400">{String(index + 1).padStart(2, "0")}</span><span className="font-bold">{item.label}</span><span className="text-sm text-slate-500">{item.count}회</span><Change value={item.change} /></div>)}{!items.length && <p className="text-sm leading-6 text-slate-500">{empty}</p>}</div></section>;
}

function Change({ value }: { value: number }) {
  if (value > 0) return <span className="flex items-center text-xs font-bold text-emerald-700"><ArrowUpRight className="size-4" aria-hidden />+{value}</span>;
  if (value < 0) return <span className="flex items-center text-xs font-bold text-rose-700"><ArrowDownRight className="size-4" aria-hidden />{value}</span>;
  return <span className="text-slate-400"><Minus className="size-4" aria-label="변화 없음" /></span>;
}
