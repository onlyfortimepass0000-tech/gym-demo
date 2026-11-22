export const DAY = 86400000;
export const HOUR = 3600000;
export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function addDays(ts: number, n: number): number {
  const d = new Date(ts);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

export function dayKey(ts: number): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseKey(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

export function fmtTime(ts: number): string {
  return new Date(ts)
    .toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
}

export function fmtDuration(ms: number): string {
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")} m`;
}

export function fmtClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function fmtDayLong(ts: number): string {
  const d = new Date(ts);
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`;
}

export function fmtDayShort(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS_LONG[d.getMonth()].slice(0, 3)}`;
}

export function fmtINR(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function fmtAgo(ts: number, now: number): string {
  const diff = now - ts;
  if (diff < 60_000) return "just now";
  if (diff < HOUR) return `${Math.round(diff / 60_000)} min ago`;
  if (diff < DAY) return `${Math.round(diff / HOUR)} h ago`;
  const days = Math.round(diff / DAY);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export type GridDay = { ts: number; inMonth: boolean };

// Monday-first month grid, always whole weeks.
export function monthGrid(year: number, month: number): GridDay[][] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Mon=0
  const start = new Date(year, month, 1 - offset).getTime();
  const lastDay = new Date(year, month + 1, 0);
  const totalCells = offset + lastDay.getDate();
  const weeks = Math.ceil(totalCells / 7);
  const out: GridDay[][] = [];
  for (let w = 0; w < weeks; w++) {
    const row: GridDay[] = [];
    for (let i = 0; i < 7; i++) {
      const ts = addDays(start, w * 7 + i);
      row.push({ ts, inMonth: new Date(ts).getMonth() === month });
    }
    out.push(row);
  }
  return out;
}
