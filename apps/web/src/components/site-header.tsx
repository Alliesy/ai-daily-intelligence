import Link from "next/link";
import { Bookmark, LogIn, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [["/", "Today"], ["/opportunities", "Opportunities"], ["/trends", "Trends"], ["/saved", "Saved"]] as const;

export function SiteHeader() {
  return <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8"><Link href="/" className="flex min-w-0 items-center gap-3 font-black tracking-tight text-slate-950"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-sky-600 text-sm text-white">AI</span><span className="hidden sm:inline">Daily Intelligence</span></Link><nav aria-label="주요 메뉴" className="ml-auto hidden items-center gap-1 md:flex">{links.map(([href, label]) => <Button key={href} variant="ghost" size="sm" asChild><Link href={href}>{label}</Link></Button>)}</nav><div className="ml-auto flex items-center gap-2 md:ml-0"><Button variant="outline" size="sm" asChild><Link href="/login?next=/"><LogIn aria-hidden />로그인</Link></Button><Button variant="ghost" size="sm" className="md:hidden" aria-label="메뉴"><Menu aria-hidden /></Button></div></div><nav aria-label="모바일 메뉴" className="flex overflow-x-auto border-t border-slate-100 px-3 py-2 md:hidden">{links.map(([href, label]) => <Link key={href} href={href} className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">{label === "Saved" && <Bookmark className="size-3" aria-hidden />}{label}</Link>)}</nav></header>;
}

