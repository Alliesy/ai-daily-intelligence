import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTrendOverview, type TrendMetricDto } from "@/lib/content";

type Props = { searchParams: Promise<{ window?: string | string[] }> };
export const metadata = { title: "트렌드", description: "최근 7일·30일 AI Topic과 Entity 변화" };

export default async function TrendsPage({ searchParams }: Props) {
  const raw = (await searchParams).window;
  const window = (Array.isArray(raw) ? raw[0] : raw) === "30" ? 30 : 7;
  const overview = await getTrendOverview(window);
  return <main><header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 lg:px-8"><p className="section-kicker">TREND INTELLIGENCE</p><div className="mt-2 flex flex-wrap items-end justify-between gap-5"><div><h1 className="text-[1.8rem] font-black tracking-[-0.03em] sm:text-[2.15rem]">신호의 방향을 읽기</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Briefing 등장 빈도를 기간 전·후반으로 비교합니다. 빈도는 중요도나 사실 신뢰도를 의미하지 않습니다.</p></div><div className="flex rounded-md border border-slate-200 bg-slate-50 p-1"><Link href="/trends?window=7" className={`rounded px-4 py-1.5 text-xs font-bold ${window === 7 ? "bg-slate-950 text-white" : "text-slate-600"}`}>7일</Link><Link href="/trends?window=30" className={`rounded px-4 py-1.5 text-xs font-bold ${window === 30 ? "bg-slate-950 text-white" : "text-slate-600"}`}>30일</Link></div></div>{overview && <p className="mt-4 text-[11px] font-semibold text-slate-500">분석 범위 {overview.from} — {overview.to}</p>}</div></header><div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{overview ? <><div className="grid gap-5 lg:grid-cols-2"><MetricSection title="Topic 변화" items={overview.topics} empty="기간 내 Topic 데이터가 없습니다." /><MetricSection title="Entity 변화" items={overview.entities} empty="현재 archive에는 구조화된 Entity 데이터가 없습니다." /></div><section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 sm:p-6"><p className="section-kicker"><Radio className="mr-1.5 inline size-3.5" aria-hidden />SIGNALS</p><h2 className="section-title">주요 커뮤니티·시장 신호</h2><div className="mt-4 divide-y divide-slate-200">{overview.signals.map((signal) => <article key={signal.id} className="grid gap-2 py-3 first:pt-0 md:grid-cols-[8rem_1fr_auto]"><div><Badge>{signal.label}</Badge>{signal.mood && <span className="mt-1 block text-[10px] text-slate-500">{signal.mood}</span>}</div><p className="text-sm leading-6 text-slate-700">{signal.summary}</p>{signal.sourceUrl && <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-700">근거 보기 ↗</a>}</article>)}</div></section></> : <p className="rounded-lg border border-slate-200 bg-white p-8">분석할 Briefing이 없습니다.</p>}</div></main>;
}
function MetricSection({ title, items, empty }: { title: string; items: TrendMetricDto[]; empty: string }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6"><h2 className="text-xl font-black">{title}</h2><div className="mt-4">{items.map((item, index) => <div key={item.label} className="grid grid-cols-[2rem_1fr_auto_auto] items-center gap-3 border-t border-slate-100 py-2.5 first:border-0"><span className="font-mono text-[11px] text-slate-400">{String(index + 1).padStart(2, "0")}</span><span className="text-sm font-bold">{item.label}</span><span className="text-xs text-slate-500">{item.count}회</span><Change value={item.change} /></div>)}{!items.length && <p className="text-sm leading-6 text-slate-500">{empty}</p>}</div></section>;
}

function Change({ value }: { value: number }) {
  if (value > 0) return <span className="flex items-center text-xs font-bold text-emerald-700"><ArrowUpRight className="size-4" aria-hidden />+{value}</span>;
  if (value < 0) return <span className="flex items-center text-xs font-bold text-rose-700"><ArrowDownRight className="size-4" aria-hidden />{value}</span>;
  return <span className="text-slate-400"><Minus className="size-4" aria-label="변화 없음" /></span>;
}
