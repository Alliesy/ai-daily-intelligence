type Row = Record<string, unknown>;

function relation(row: Row, key: string): Row {
  const value = row[key];
  if (Array.isArray(value)) return (value[0] ?? {}) as Row;
  return value && typeof value === "object" ? value as Row : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : -1;
}

export function compareOccurrenceRecency(left: Row, right: Row) {
  const leftBriefing = relation(left, "daily_briefings");
  const rightBriefing = relation(right, "daily_briefings");
  return text(rightBriefing.date_kst).localeCompare(text(leftBriefing.date_kst))
    || number(rightBriefing.source_revision) - number(leftBriefing.source_revision)
    || text(right.briefing_id).localeCompare(text(left.briefing_id));
}

export function selectLatestOccurrence(rows: Row[]) {
  return [...rows].sort(compareOccurrenceRecency)[0] ?? null;
}

export function selectOccurrenceByDate(rows: Row[], dateKst?: string) {
  const scoped = dateKst
    ? rows.filter((row) => text(relation(row, "daily_briefings").date_kst) === dateKst)
    : rows;
  return selectLatestOccurrence(scoped);
}

export function selectLatestSourceOccurrences(rows: Row[]) {
  const latest = new Map<string, Row>();
  for (const row of [...rows].sort(compareOccurrenceRecency)) {
    const key = `${text(row.event_id)}:${text(row.source_id)}`;
    if (!latest.has(key)) latest.set(key, row);
  }
  return [...latest.values()].sort((left, right) => {
    const primary = Number(right.is_primary === true) - Number(left.is_primary === true);
    if (primary) return primary;
    const order = number(left.display_order) - number(right.display_order);
    return order || text(left.source_id).localeCompare(text(right.source_id));
  });
}

export function mergeRedirectSlug(event: Row, target: Row | null) {
  const mergedInto = text(event.merged_into_event_id);
  if (!mergedInto || !target || text(target.id) !== mergedInto) return null;
  const slug = text(target.slug);
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null;
}
