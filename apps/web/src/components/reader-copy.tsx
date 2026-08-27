import type { EventDto } from "@/lib/content";
import { buildReaderSections } from "@/lib/content/reader-content";

export function ReaderCopy({ event }: { event: EventDto }) {
  const sections = buildReaderSections(event);
  if (!sections.length) return null;

  return <section aria-labelledby="reader-copy-heading" className="detail-section">
    <div className="detail-heading"><span>1.</span><h2 id="reader-copy-heading">먼저 읽어보세요</h2><span className="content-mode">핵심 설명</span></div>
    <div className="mt-4 divide-y divide-stone-200 border-y border-stone-200 bg-[#fdfcf9] px-4 sm:px-5">
      {sections.map((section) => <div key={section.label} className="grid gap-2 py-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-5">
        <h3 className="text-sm font-extrabold text-stone-900">{section.label}</h3>
        <p className="text-[15px] leading-7 text-stone-700">{section.body}</p>
      </div>)}
    </div>
  </section>;
}
