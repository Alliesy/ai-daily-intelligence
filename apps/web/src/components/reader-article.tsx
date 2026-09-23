import type { ReaderContentDto } from "../lib/content/types";

export function ReaderArticle({ reader }: { reader: ReaderContentDto }) {
  const sections = [
    { key: "takeaway", label: "하나만 기억한다면", text: reader.takeaway },
    { key: "watch", label: "앞으로 볼 건", text: reader.whatToWatch },
    { key: "action", label: "지금 확인할 것", text: reader.action },
  ];
  return <div data-reader-mode="1.3" className="mx-auto max-w-[46rem] font-sans text-stone-800">
    <section aria-label="기사 본문" className="space-y-6 text-[16px] leading-[1.9] sm:text-[17px]">
      {reader.body.split("\n\n").map((paragraph, index) => <p key={index} className="whitespace-pre-wrap break-words">{paragraph}</p>)}
    </section>
    {sections.map(({ key, label, text }) => text !== null && <section key={key} aria-labelledby={`reader-${key}`} className="mt-8 border-t border-stone-200 pt-5">
      <h2 id={`reader-${key}`} className="text-sm font-semibold text-stone-700">{label}</h2>
      <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-7">{text}</p>
    </section>)}
  </div>;
}
