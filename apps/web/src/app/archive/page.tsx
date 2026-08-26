import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { getBriefingSummaries, searchBriefings } from "@/lib/content";
import { buildCalendarGrid, isValidArchiveMonth, shiftArchiveMonth } from "@/lib/content/calendar";

export const dynamic = "force-dynamic";

function displayDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", timeZone: "Asia/Seoul" }).format(new Date(`${value}T00:00:00+09:00`));
}

export default async function ArchivePage({ searchParams }: { searchParams: Promise<{ q?: string; month?: string; all?: string }> }) {
  const { q = "", month, all: showAll } = await searchParams;
  const summaries = q.trim() ? await searchBriefings(q) : await getBriefingSummaries();
  const all = await getBriefingSummaries();
  const visibleSummaries = q || showAll === "1" ? summaries : summaries.slice(0, 8);
  const latest = all[0];
  const selectedMonth = isValidArchiveMonth(month ?? "") ? month! : latest?.dateKst.slice(0, 7);
  const monthDate = selectedMonth ? new Date(`${selectedMonth}-01T00:00:00+09:00`) : null;
  const monthLabel = monthDate ? new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", timeZone: "Asia/Seoul" }).format(monthDate) : "브리핑";
  const calendar = selectedMonth ? buildCalendarGrid(selectedMonth, all.map((item) => item.dateKst)) : { leadingBlanks: 0, cells: [] };
  return (
    <main className="min-h-[70vh] bg-[#fdfcf9]">
      <div className="mx-auto max-w-[1080px] px-5 py-10 sm:px-8 lg:py-14">
        <p className="text-xs font-semibold tracking-[0.12em] text-stone-500">DAILY ARCHIVE</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.035em] text-stone-950">아카이브</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">이전 데일리 브리핑을 날짜 또는 키워드로 검색하세요.</p>
        <form action="/archive" className="mt-7 flex h-12 items-center rounded-md border border-stone-300 bg-white px-4 focus-within:ring-2 focus-within:ring-stone-900">
          <input name="q" defaultValue={q} aria-label="날짜 또는 키워드 검색" placeholder="날짜 또는 키워드 검색" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400" />
          <button type="submit" aria-label="검색" className="grid size-9 place-items-center"><Search className="size-4" /></button>
        </form>

        {!q && latest && selectedMonth && (
          <section aria-labelledby="calendar-heading" className="mt-9 rounded-md border border-stone-300 bg-white p-5 sm:p-7">
            <div className="flex items-center justify-between"><Link href={`/archive?month=${shiftArchiveMonth(selectedMonth, -1)}`} aria-label="이전 달" className="grid size-10 place-items-center rounded-full hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"><ChevronLeft className="size-4" /></Link><h2 id="calendar-heading" className="flex items-center justify-center gap-2 font-serif text-xl font-semibold"><CalendarDays className="size-5" />{monthLabel}</h2><Link href={`/archive?month=${shiftArchiveMonth(selectedMonth, 1)}`} aria-label="다음 달" className="grid size-10 place-items-center rounded-full hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"><ChevronRight className="size-4" /></Link></div>
            <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs text-stone-500">{["월","화","수","목","금","토","일"].map((day) => <span key={day}>{day}</span>)}</div>
            <div className="mt-2 grid grid-cols-7 gap-2">{Array.from({ length: calendar.leadingBlanks }, (_, index) => <span key={`blank-${index}`} aria-hidden />)}{calendar.cells.map((cell) => {
              return cell.hasBriefing ? <Link key={cell.day} href={`/daily/${cell.dateKst}`} aria-label={`${cell.dateKst} 브리핑`} className="grid aspect-square place-items-center rounded-full text-xs font-semibold text-stone-800 hover:bg-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 data-[latest=true]:bg-stone-950 data-[latest=true]:text-white" data-latest={cell.dateKst === latest.dateKst}>{cell.day}</Link> : <span key={cell.day} aria-label={`${cell.dateKst} 브리핑 없음`} className="grid aspect-square place-items-center text-xs text-stone-300">{cell.day}</span>;
            })}</div>
          </section>
        )}

        <section aria-labelledby="recent-heading" className="mt-10">
          <div className="flex items-center justify-between"><h2 id="recent-heading" className="font-serif text-xl font-semibold">{q ? `“${q}” 검색 결과` : "최근 브리핑"}</h2><span className="text-xs text-stone-500">{summaries.length}건</span></div>
          <div className="mt-4 divide-y divide-stone-300 border-y border-stone-300">
            {visibleSummaries.map((summary) => <Link key={summary.dateKst} href={`/daily/${summary.dateKst}`} className="group grid gap-3 py-5 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center">
              <p className="text-xs text-stone-500">{displayDate(summary.dateKst)}</p>
              <div><h3 className="font-serif text-lg font-semibold leading-7 group-hover:underline">{summary.headline}</h3><p className="mt-2 text-[11px] text-stone-500">Event {summary.eventCount}건 · 출처 {summary.sourceCount}개 · 공식 {summary.officialSourceCount}개{summary.status === "partial" ? " · 일부 검증 중" : ""}</p></div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold">보기 <ArrowRight className="size-3.5" /></span>
            </Link>)}
            {!summaries.length && <p className="py-10 text-center text-sm text-stone-500">일치하는 브리핑이 없습니다.</p>}
          </div>
          {!q && showAll !== "1" && summaries.length > visibleSummaries.length && <Link href="/archive?all=1" className="mt-5 flex h-11 items-center justify-center rounded-md border border-stone-300 bg-white text-sm font-semibold hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900">더 많은 브리핑 보기</Link>}
        </section>
      </div>
    </main>
  );
}
