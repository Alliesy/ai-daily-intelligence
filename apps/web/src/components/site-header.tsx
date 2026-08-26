"use client";

import Link from "next/link";
import { Archive, Bookmark, Home, Menu, MoreHorizontal, Search, TrendingUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { AuthEntry } from "@/components/auth-entry";
import { cn } from "@/lib/utils";

const links = [
  ["/", "오늘"],
  ["/archive", "아카이브"],
  ["/trends", "트렌드"],
  ["/opportunities", "사업 기회"],
  ["/resources", "도구·자료"],
  ["/saved", "저장됨"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-stone-200/90 bg-[#fdfcf9]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-5 px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex min-w-0 items-center font-serif text-[17px] font-semibold tracking-[-0.025em] text-stone-950 sm:text-lg">
            AI Daily Intelligence
          </Link>
          <nav aria-label="주요 메뉴" className="ml-10 hidden h-full items-center gap-8 md:flex">
            {links.map(([href, label]) => {
              const base = href.split("#")[0] || "/";
              const active = base === "/" ? pathname === "/" && href === "/" : pathname.startsWith(base);
              return (
                <Link key={href} href={href} className={cn(
                  "relative flex h-full items-center text-xs font-semibold text-stone-700 transition hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900",
                  active && "text-stone-950 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-stone-950",
                )}>{label}</Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <Link href="/archive" aria-label="브리핑 검색" className="grid size-9 place-items-center rounded-md text-stone-700 transition hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900">
              <Search className="size-[18px]" aria-hidden />
            </Link>
            <div className="hidden md:block"><AuthEntry /></div>
            <details className="relative md:hidden">
              <summary aria-label="메뉴 열기" className="grid size-9 cursor-pointer list-none place-items-center rounded-md text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                <Menu className="size-5 text-stone-800" aria-hidden />
              </summary>
              <nav aria-label="모바일 메뉴" className="absolute right-0 top-11 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                {links.map(([href, label]) => <Link key={href} href={href} className="block rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">{label}</Link>)}
                <div className="mt-2 border-t border-slate-100 pt-2"><AuthEntry /></div>
              </nav>
            </details>
          </div>
        </div>
      </header>
      <nav aria-label="모바일 하단 메뉴" className="fixed inset-x-0 bottom-0 z-50 grid h-[66px] grid-cols-5 border-t border-stone-200 bg-[#fdfcf9]/98 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(15,23,42,0.04)] md:hidden">
        <Link href="/" className={cn("mobile-nav-item", pathname === "/" && "is-active")}><Home aria-hidden /><span>오늘</span></Link>
        <Link href="/archive" className={cn("mobile-nav-item", pathname.startsWith("/archive") || pathname.startsWith("/daily") ? "is-active" : "")}><Archive aria-hidden /><span>아카이브</span></Link>
        <Link href="/trends" className={cn("mobile-nav-item", pathname.startsWith("/trends") && "is-active")}><TrendingUp aria-hidden /><span>트렌드</span></Link>
        <Link href="/saved" className={cn("mobile-nav-item", pathname.startsWith("/saved") && "is-active")}><Bookmark aria-hidden /><span>저장됨</span></Link>
        <Link href="/resources" className={cn("mobile-nav-item", pathname.startsWith("/resources") && "is-active")}><MoreHorizontal aria-hidden /><span>더보기</span></Link>
      </nav>
    </>
  );
}
