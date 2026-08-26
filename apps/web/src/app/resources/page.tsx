import { ExternalLink } from "lucide-react";
import { getLatestBriefing } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const briefing = await getLatestBriefing();
  const resources = briefing ? [...new Map(briefing.resources.map((item) => [item.url || item.id, item])).values()] : [];
  return <main className="min-h-[70vh] bg-[#fdfcf9]"><div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:py-14"><h1 className="font-serif text-4xl font-semibold tracking-[-0.035em]">도구·자료</h1><p className="mt-3 text-sm text-stone-600">오늘의 검증된 도구, 오픈소스, 논문과 읽을거리입니다.</p><div className="mt-8 divide-y divide-stone-300 border-y border-stone-300">{resources.map((resource) => <a key={resource.id} href={resource.url} target="_blank" rel="noopener noreferrer" className="group grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-5"><div><span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">{resource.type.replaceAll("_", " ")}</span><h2 className="mt-2 font-serif text-xl font-semibold group-hover:underline">{resource.title}</h2><p className="mt-2 text-sm leading-6 text-stone-600">{resource.whyRelevant}</p></div><ExternalLink className="mt-1 size-4 text-stone-500" /></a>)}{!resources.length && <p className="py-8 text-sm text-stone-500">공개된 자료가 없습니다.</p>}</div></div></main>;
}
