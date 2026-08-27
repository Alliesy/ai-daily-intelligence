import type { EventDto } from "./types";

export interface ReaderSection {
  label: string;
  body: string;
}

/** Projects already-edited Git content into reader order without rewriting it. */
export function buildReaderSections(event: Pick<EventDto, "whyItMatters" | "outlook">): ReaderSection[] {
  return [
    event.whyItMatters ? { label: "왜 알아야 할까요?", body: event.whyItMatters } : null,
    event.outlook ? { label: "앞으로 볼 건", body: event.outlook } : null,
  ].filter((section): section is ReaderSection => section !== null);
}
