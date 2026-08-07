import { CheckCircle2, FlaskConical, Gauge, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getLatestBriefing } from "@/lib/content";

export const metadata = { title: "Opportunities", description: "AI 변화에서 발견한 근거 기반 사업 기회" };

export default async function OpportunitiesPage() {
  const briefing = await getLatestBriefing();
  const opportunities = briefing?.opportunities ?? [];
  return <main><header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8"><p className="section-kicker">OPPORTUNITY RADAR</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">작은 팀이 검증할 사업 기회</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">뉴스의 화제성이 아니라 고객 문제, 차별화, 2주 MVP와 반증 조건까지 함께 봅니다.</p></div></header><div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"><div className="grid gap-6">{opportunities.map((idea, index) => <article id={`opportunity-${index + 1}`} key={idea.id} className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><Badge>{idea.potential} POTENTIAL</Badge><Badge>{idea.difficulty} DIFFICULTY</Badge></div><h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">{idea.name}</h2></div><div className="rounded-2xl bg-slate-950 px-5 py-3 text-center text-white"><span className="block text-2xl font-black">{idea.score.toFixed(1)}</span><span className="text-[10px] font-bold tracking-wider text-slate-400">AI SCORE · UI 참고</span></div></div><div className="mt-8 grid gap-5 md:grid-cols-2"><Info icon={Target} title="대상 고객" text={idea.customer} /><Info icon={Gauge} title="핵심 문제" text={idea.problem} /><Info icon={CheckCircle2} title="차별화" text={idea.differentiation} /><Info icon={FlaskConical} title="2주 MVP" text={idea.mvp} /></div><div className="mt-5 grid gap-5 rounded-2xl bg-slate-50 p-5 md:grid-cols-2"><div><h3 className="text-sm font-black">수익화</h3><p className="mt-2 text-sm leading-6 text-slate-600">{idea.monetization}</p></div><div><h3 className="text-sm font-black text-rose-700">반증 조건</h3><p className="mt-2 text-sm leading-6 text-slate-600">{idea.falsification}</p></div></div></article>)}</div>{!opportunities.length && <p className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">공개된 사업 기회가 없습니다.</p>}</div></main>;
}
function Info({ icon: Icon, title, text }: { icon: typeof Target; title: string; text: string }) {
  return <div className="rounded-2xl border border-slate-100 p-5"><Icon className="size-5 text-sky-600" aria-hidden /><h3 className="mt-3 text-sm font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>;
}
