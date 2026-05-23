export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseLogDate(value?: string | null) {
  const source = value || dateKey(new Date());
  return new Date(`${source}T12:00:00.000Z`);
}

export function rangeStart(days: number) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - Math.max(0, days - 1));
  return start;
}
