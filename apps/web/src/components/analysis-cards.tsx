import { Binoculars, FileCheck2, HelpCircle, Lightbulb, Radio, ScanSearch } from "lucide-react";
import type { EventDto } from "@/lib/content";

const items = [
  { key: "fact", label: "사실", code: "FACT", icon: FileCheck2, accent: "text-blue-600 bg-blue-50" },
  { key: "interpretation", label: "해석", code: "INTERPRETATION", icon: ScanSearch, accent: "text-indigo-600 bg-indigo-50" },
  { key: "signal", label: "신호", code: "SIGNAL", icon: Radio, accent: "text-teal-600 bg-teal-50" },
  { key: "speculation", label: "전망 / 추정", code: "OUTLOOK", icon: Binoculars, accent: "text-violet-600 bg-violet-50" },
  { key: "whyItMatters", label: "왜 중요한가", code: "WHY IT MATTERS", icon: HelpCircle, accent: "text-amber-600 bg-amber-50" },
  { key: "outlook", label: "앞으로의 전망", code: "FORECAST", icon: Lightbulb, accent: "text-emerald-600 bg-emerald-50" },
] as const;

export function AnalysisCards({ event }: { event: EventDto }) {
  const available = items.filter((item) => event[item.key]);
  return <section aria-labelledby="analysis-heading" className="detail-section">
    <div className="detail-heading"><span>2.</span><h2 id="analysis-heading">AI 인텔리전스 분석</h2></div>
    <div className="mt-4 hidden grid-cols-2 gap-3 md:grid lg:grid-cols-3">{available.map(({ key, label, code, icon: Icon, accent }) => <article key={key} className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2"><span className={`grid size-7 place-items-center rounded-md ${accent}`}><Icon className="size-4" aria-hidden /></span><div><h3 className="text-sm font-extrabold text-slate-950">{label}</h3><p className="text-[9px] font-bold tracking-[0.08em] text-slate-400">{code}</p></div></div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{event[key]}</p>
    </article>)}</div>
    <div className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white md:hidden">{available.map(({ key, label, code, icon: Icon, accent }, index) => <details key={key} open={index === 0} className="group">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"><span className={`grid size-6 place-items-center rounded ${accent}`}><Icon className="size-3.5" aria-hidden /></span><span className="text-sm font-bold">{label}</span><span className="text-[9px] font-semibold text-slate-400">({code})</span><span className="ml-auto text-slate-400 transition group-open:rotate-180">⌄</span></summary>
      <p className="px-4 pb-4 text-sm leading-6 text-slate-700">{event[key]}</p>
    </details>)}</div>
  </section>;
}
