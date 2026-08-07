import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "AI Daily Intelligence", template: "%s · AI Daily Intelligence" },
  description: "검증된 AI 사건과 사업 기회를 매일 읽기 좋은 한국어 브리핑으로 제공합니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko" className="h-full antialiased"><body className="min-h-full bg-[#f8fafc] text-slate-950"><SiteHeader />{children}<footer className="border-t border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-4 py-8 text-xs leading-6 text-slate-500 sm:px-6 lg:px-8">AI Daily Intelligence · Git archive를 정본으로 유지하는 공개 AI 인텔리전스 서비스</div></footer></body></html>;
}
