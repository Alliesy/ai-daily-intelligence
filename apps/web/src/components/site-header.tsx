"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { AuthEntry } from "@/components/auth-entry";
import { cn } from "@/lib/utils";

const links = [["/", "오늘"], ["/trends", "트렌드"], ["/opportunities", "사업 기회"], ["/#resources", "도구 & 자료"], ["/saved", "저장됨"]] as const;

export function SiteHeader() {
  const pathname = usePathname();
  return <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
    <div className="mx-auto flex h-[52px] max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-8">
      <details className="relative md:hidden"><summary aria-label="메뉴 열기" className="grid size-8 cursor-pointer list-none place-items-center rounded-md hover:bg-slate-100"><Menu className="size-4" aria-hidden /></summary><nav aria-label="모바일 메뉴" className="absolute left-0 top-10 w-44 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">{links.map(([href, label]) => <Link key={href} href={href} className="block rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">{label}</Link>)}</nav></details>
      <Link href="/" className="flex min-w-0 items-center gap-1 font-black tracking-[-0.025em] text-slate-950"><span className="text-blue-600">AI</span><span>Daily Intelligence</span></Link>
      <nav aria-label="주요 메뉴" className="ml-8 hidden h-full items-center gap-6 md:flex">{links.map(([href, label]) => { const base = href.split("#")[0] || "/"; const active = base === "/" ? pathname === "/" && !href.includes("#") : pathname.startsWith(base); return <Link key={href} href={href} className={cn("relative flex h-full items-center text-xs font-bold text-slate-700 hover:text-blue-700", active && "text-blue-700 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-blue-600")}>{label}</Link>; })}</nav>
      <div className="ml-auto"><AuthEntry /></div>
    </div>
  </header>;
}
