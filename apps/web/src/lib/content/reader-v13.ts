import type { EventDto, ReaderContentDto } from "./types";

const keys = ["version", "headline", "dek", "body", "takeaway", "what_to_watch", "action"];
const nonempty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

/** Validate an atomic Git/occurrence snapshot. No aliases, trimming or copy generation. */
export function parseReaderContent(value: unknown): ReaderContentDto | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const reader = value as Record<string, unknown>;
  if (Object.keys(reader).length !== keys.length || keys.some((key) => !Object.hasOwn(reader, key))) return null;
  if (reader.version !== "1.3" || !nonempty(reader.headline) || !nonempty(reader.dek) || !nonempty(reader.body)) return null;
  if ([reader.takeaway, reader.what_to_watch, reader.action].some((field) => field !== null && !nonempty(field))) return null;
  return {
    version: "1.3", headline: reader.headline, dek: reader.dek, body: reader.body,
    takeaway: reader.takeaway as string | null,
    whatToWatch: reader.what_to_watch as string | null,
    action: reader.action as string | null,
  };
}

export function eventReaderHeader(event: Pick<EventDto, "reader" | "title" | "oneLineSummary">) {
  return event.reader
    ? { headline: event.reader.headline, dek: event.reader.dek }
    : { headline: event.title, dek: event.oneLineSummary };
}
