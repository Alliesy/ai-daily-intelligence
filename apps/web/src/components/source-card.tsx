import Image from "next/image";
import { BookOpen, Code2, ExternalLink, FileCode2, FileText, MessageCircle, Newspaper, Play, Radio, Video } from "lucide-react";
import type { SourceDto } from "@/lib/content";

const typeLabels: Record<SourceDto["sourceType"], string> = { official_blog: "공식 발표", article: "뉴스", youtube: "영상", x: "소셜", github: "코드", paper: "논문", documentation: "문서", reddit: "커뮤니티", hackernews: "커뮤니티", other: "분석 자료" };
const authorityLabels: Record<SourceDto["authority"], string> = { official: "공식", primary: "1차 자료", independent: "독립", analysis: "분석", community: "커뮤니티", unknown: "성격 미확인" };
const verificationLabels: Record<SourceDto["verificationStatus"], string> = { verified: "검증됨", corroborated: "교차 확인", unverified: "미검증", disputed: "논쟁 중" };
const icons = { official_blog: Radio, article: Newspaper, youtube: Video, x: MessageCircle, github: Code2, paper: BookOpen, documentation: FileCode2, reddit: MessageCircle, hackernews: MessageCircle, other: FileText } as const;

export function SourceCard({ source }: { source: SourceDto }) {
  const Icon = icons[source.sourceType];
  const showThumbnail = source.sourceType === "youtube" && source.thumbnailUrl;
  return <a href={source.url} target="_blank" rel="noopener noreferrer" className="group grid min-w-0 grid-cols-[1.5rem_1fr_auto] items-center gap-2.5 px-3 py-3 transition hover:bg-blue-50/60 sm:grid-cols-[1.5rem_5rem_minmax(0,1fr)_9rem_8rem_1.25rem] sm:px-4 lg:grid-cols-[1.5rem_5rem_minmax(0,1fr)_9rem_10rem_5rem]">
    <Icon className="size-4 text-slate-500 group-hover:text-blue-600" aria-hidden />
    <span className="hidden rounded bg-slate-100 px-2 py-1 text-center text-[10px] font-bold text-slate-600 sm:block">{typeLabels[source.sourceType]}</span>
    <span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-900 group-hover:text-blue-700">{source.title}</span><span className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-slate-500 sm:hidden">{source.publisher}<span>{authorityLabels[source.authority]}</span><span>{verificationLabels[source.verificationStatus]}</span></span></span>
    <span className="hidden truncate text-xs text-slate-500 sm:block">{source.publisher}</span>
    <span className="hidden text-right text-[11px] text-slate-500 sm:block">{authorityLabels[source.authority]} · {verificationLabels[source.verificationStatus]}{source.publishedAt ? ` · ${source.publishedAt.slice(0, 10)}` : ""}</span>
    <span className="relative flex items-center justify-end">{showThumbnail && <span className="relative mr-2 hidden h-8 w-14 overflow-hidden rounded bg-slate-100 lg:block"><Image src={source.thumbnailUrl!} alt="" fill sizes="56px" className="object-cover" unoptimized /><Play className="absolute inset-0 m-auto size-3 fill-white text-white" aria-hidden /></span>}<ExternalLink className="size-3.5 text-slate-400" aria-hidden /></span>
  </a>;
}
