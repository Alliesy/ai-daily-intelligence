"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { loadVisitorStats } from "@/lib/analytics/client";
import type { VisitorStats } from "@/lib/analytics/types";

const number = new Intl.NumberFormat("ko-KR");

export function VisitorMetadata({ compact = false }: { compact?: boolean }) {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  useEffect(() => { void loadVisitorStats().then((next) => { if (next) setStats(next); }); }, []);

  const today = stats?.todayUnique === null || stats?.todayUnique === undefined
    ? "오늘 집계 준비 중"
    : `오늘 ${number.format(stats.todayUnique)}`;

  if (compact) {
    return <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-stone-500">
      <Users aria-hidden="true" className="size-3.5" />
      <>{today} · 누적 미집계</>
    </p>;
  }

  return <div className="mt-5 border-t border-stone-200 pt-5">
    <dl className="space-y-3 text-sm">
      <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2 text-stone-500"><Users aria-hidden="true" className="size-4" />오늘 방문</dt><dd className="font-medium tabular-nums text-stone-700">{stats?.todayUnique === null || stats?.todayUnique === undefined ? "집계 준비 중" : `${number.format(stats.todayUnique)}명`}</dd></div>
      <div className="flex items-center justify-between gap-4"><dt className="pl-6 text-stone-500">누적 방문</dt><dd className="font-medium text-stone-500">미집계</dd></div>
    </dl>
    <p className="mt-2 pl-6 text-[10px] text-stone-400">Vercel 익명 일일 기준</p>
  </div>;
}
