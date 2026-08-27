"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useId, useState } from "react";
import type { OriginalContentDto } from "@/lib/content";

export function OriginalContent({ content, sectionNumber = "1." }: { content: OriginalContentDto; sectionNumber?: string }) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  if (content.mode === "unavailable") return <section aria-labelledby={`${contentId}-title`} className="detail-section">
    <div className="detail-heading"><span>{sectionNumber}</span><h2 id={`${contentId}-title`}>원문 기반 상세 내용</h2><span className="content-mode">원문 내용 미확보</span></div>
    <p className="mt-3 border-l-2 border-slate-200 pl-4 text-sm leading-6 text-slate-500">현재 archive에 검증 가능한 상세 본문이 없어 내용을 만들어내지 않았습니다. 상단 원문 링크에서 전체 내용을 확인할 수 있습니다.</p>
  </section>;

  return <section aria-labelledby={`${contentId}-title`} className="detail-section">
    <div className="detail-heading"><span>{sectionNumber}</span><h2 id={`${contentId}-title`}>원문 기반 상세 내용</h2><span className="content-mode">{content.label}</span></div>
    <p className="mt-2 text-xs leading-5 text-slate-500">외부 기사의 전문 번역이 아니라, Git 정본에 저장된 출처 기반 상세 요약입니다.</p>
    <div id={contentId} className="relative mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white" style={{ maxHeight: expanded ? "none" : "10.5rem" }}>
      <div className="space-y-5 px-5 py-4 sm:px-6 sm:py-5">{content.sections.map((section) => <div key={section.title}><h3 className="text-xs font-bold text-slate-500">{section.title}</h3><p className="mt-1.5 text-[15px] leading-7 text-slate-800">{section.body}</p></div>)}</div>
      {!expanded && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/90 to-transparent" />}
    </div>
    <button type="button" aria-expanded={expanded} aria-controls={contentId} onClick={() => setExpanded((value) => !value)} className="mt-[-1px] flex h-9 w-full items-center justify-center gap-1 rounded-b-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
      {expanded ? <>접기<ChevronUp className="size-3.5" aria-hidden /></> : <>자세히 보기<ChevronDown className="size-3.5" aria-hidden /></>}
    </button>
  </section>;
}
