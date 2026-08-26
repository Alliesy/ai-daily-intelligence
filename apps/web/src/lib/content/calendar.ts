export type CalendarCell = { day: number; dateKst: string; hasBriefing: boolean };

export function isValidArchiveMonth(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
}

export function buildCalendarGrid(month: string, briefingDates: string[]) {
  if (!isValidArchiveMonth(month)) return { leadingBlanks: 0, cells: [] as CalendarCell[] };
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const available = new Set(briefingDates);
  return {
    leadingBlanks: (first.getUTCDay() + 6) % 7,
    cells: Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const dateKst = `${month}-${String(day).padStart(2, "0")}`;
      return { day, dateKst, hasBriefing: available.has(dateKst) };
    }),
  };
}

export function shiftArchiveMonth(month: string, delta: number) {
  if (!isValidArchiveMonth(month)) return "";
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  const shifted = new Date(Date.UTC(year, monthIndex + delta, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function isValidDateKst(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
