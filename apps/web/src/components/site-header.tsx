"use client";

import Link from "next/link";
import { Bookmark, FileText, Home, Menu, Search, TrendingUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { AuthEntry } from "@/components/auth-entry";
import { cn } from "@/lib/utils";

const links = [
  ["/", "오늘"],
  ["/#top-news", "뉴스"],
  ["/trends", "트렌드"],
  ["/opportunities", "사업 기회"],
  ["/#resources", "도구 & 자료"],
  ["/saved", "저장됨"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-5 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-1 text-[15px] font-black tracking-[-0.035em] text-slate-950 sm:text-base">
            <span className="text-blue-600">AI</span><span>Daily Intelligence</span>
          </Link>
          <nav aria-label="주요 메뉴" className="ml-12 hidden h-full items-center gap-8 md:flex">
            {links.map(([href, label]) => {
              const base = href.split("#")[0] || "/";
              const active = base === "/" ? pathname === "/" && href === "/" : pathname.startsWith(base);
              return (
                <Link key={href} href={href} className={cn(
                  "relative flex h-full items-center text-xs font-bold text-slate-700 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                  active && "text-blue-700 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-blue-600",
                )}>{label}</Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <Link href="/#top-news" aria-label="핵심 뉴스로 이동" className="grid size-9 place-items-center rounded-md text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
              <Search className="size-[18px]" aria-hidden />
            </Link>
            <div className="hidden md:block"><AuthEntry /></div>
            <details className="relative md:hidden">
              <summary aria-label="메뉴 열기" className="grid size-9 cursor-pointer list-none place-items-center rounded-md text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                <Menu className="size-5" aria-hidden />
              </summary>
              <nav aria-label="모바일 메뉴" className="absolute right-0 top-11 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                {links.map(([href, label]) => <Link key={href} href={href} className="block rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">{label}</Link>)}
                <div className="mt-2 border-t border-slate-100 pt-2"><AuthEntry /></div>
              </nav>
            </details>
          </div>
        </div>
      </header>
      <nav aria-label="모바일 하단 메뉴" className="fixed inset-x-0 bottom-0 z-50 grid h-[66px] grid-cols-5 border-t border-slate-200 bg-white/98 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(15,23,42,0.06)] md:hidden">
        <Link href="/" className={cn("mobile-nav-item", pathname === "/" && "is-active")}><Home aria-hidden /><span>오늘</span></Link>
        <Link href="/#top-news" className="mobile-nav-item"><FileText aria-hidden /><span>뉴스</span></Link>
        <Link href="/trends" className={cn("mobile-nav-item", pathname.startsWith("/trends") && "is-active")}><TrendingUp aria-hidden /><span>트렌드</span></Link>
        <Link href="/saved" className={cn("mobile-nav-item", pathname.startsWith("/saved") && "is-active")}><Bookmark aria-hidden /><span>저장됨</span></Link>
        <AuthEntry view="mobile-nav" />
      </nav>
    </>
  );
}
