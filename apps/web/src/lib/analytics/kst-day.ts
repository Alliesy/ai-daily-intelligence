const formatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Seoul",
});

export function kstDayKey(value: Date | number = new Date()) {
  const parts = Object.fromEntries(formatter.formatToParts(value).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function kstDayRange(value: Date | number = new Date()) {
  const since = new Date(`${kstDayKey(value)}T00:00:00+09:00`);
  const until = new Date(since.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { since: since.toISOString(), until: until.toISOString() };
}
