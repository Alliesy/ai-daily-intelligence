"use client";

import { useMemo, useState } from "react";
import type { SourceDto } from "@/lib/content";
import { SourceCard } from "@/components/source-card";

type Category = "all" | "official" | "news" | "video" | "social" | "code" | "community";
const labels: Record<Category, string> = { all: "전체", official: "공식 자료", news: "뉴스 / 보도", video: "영상", social: "소셜", code: "코드 / 문서", community: "커뮤니티" };

function category(source: SourceDto): Category {
  if (source.authority === "official" || source.sourceType === "official_blog") return "official";
  if (source.sourceType === "article") return "news";
  if (source.sourceType === "youtube") return "video";
  if (source.sourceType === "x") return "social";
  if (["github", "paper", "documentation"].includes(source.sourceType)) return "code";
  if (["reddit", "hackernews"].includes(source.sourceType) || source.authority === "community") return "community";
  return "news";
}

export function SourceList({ sources }: { sources: SourceDto[] }) {
  const [active, setActive] = useState<Category>("all");
  const categories = useMemo(() => (["official", "news", "video", "social", "code", "community"] as Category[]).filter((item) => sources.some((source) => category(source) === item)), [sources]);
  const visible = active === "all" ? sources : sources.filter((source) => category(source) === active);
  const showFilters = sources.length >= 5 && categories.length > 1;

  return <div>{showFilters && <div className="mb-3 flex flex-wrap gap-1.5" aria-label="관련 자료 필터">{(["all", ...categories] as Category[]).map((item) => <button type="button" key={item} aria-pressed={active === item} onClick={() => setActive(item)} className={`rounded-md px-2.5 py-1.5 text-xs font-bold ${active === item ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{labels[item]}{item === "all" ? ` ${sources.length}` : ""}</button>)}</div>}
    <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">{visible.map((source) => <SourceCard key={source.id} source={source} />)}</div>
  </div>;
}
