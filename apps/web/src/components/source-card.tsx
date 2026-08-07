import Image from "next/image";
import { ExternalLink, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SourceDto } from "@/lib/content";

const typeLabels: Record<SourceDto["sourceType"], string> = { official_blog: "공식 발표", article: "Article", youtube: "YouTube", x: "X", github: "GitHub", paper: "Paper", documentation: "Documentation", reddit: "Reddit", hackernews: "Hacker News", other: "기타" };

export function SourceCard({ source }: { source: SourceDto }) {
  return <a href={source.url} target="_blank" rel="noopener noreferrer" className="group grid overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-sky-300 hover:shadow-sm sm:grid-cols-[1fr_auto]"><div className="p-5"><div className="mb-3 flex flex-wrap gap-2"><Badge>{typeLabels[source.sourceType]}</Badge><Badge>{source.authority.toUpperCase()}</Badge><Badge>{source.verificationStatus.toUpperCase()}</Badge>{source.isPrimary && <Badge className="border-sky-200 bg-sky-50 text-sky-700">대표 원본</Badge>}</div><h3 className="font-bold leading-6 text-slate-900 group-hover:text-sky-700">{source.title}</h3><p className="mt-2 flex items-center gap-2 text-xs text-slate-500">{source.publisher}{source.publishedAt ? ` · ${source.publishedAt.slice(0, 10)}` : ""}<ExternalLink className="size-3" aria-hidden /></p></div>{source.thumbnailUrl && <div className="relative min-h-36 bg-slate-100 sm:w-56"><Image src={source.thumbnailUrl} alt={`${source.title} 영상 썸네일`} fill sizes="(max-width: 640px) 100vw, 224px" className="object-cover" unoptimized /><span className="absolute inset-0 grid place-items-center bg-black/10"><span className="grid size-11 place-items-center rounded-full bg-white/90 text-slate-950"><Play className="size-5 fill-current" aria-hidden /></span></span></div>}</a>;
}

