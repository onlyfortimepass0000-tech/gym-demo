import { CURRENT_MEMBER_ID, getDb } from "./db";
import type { AttendanceCell, AttendanceData } from "./types";

const DAY = 86400000;

function intensityForMinutes(m: number): 0 | 1 | 2 | 3 {
  if (m <= 0) return 0;
  if (m < 35) return 1;
  if (m < 60) return 2;
  return 3;
}

export function getAttendance(memberId = CURRENT_MEMBER_ID): AttendanceData {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT check_in, check_out FROM sessions
       WHERE member_id = ? AND check_in >= ?
       ORDER BY check_in ASC`
    )
    .all(memberId, Date.now() - 56 * DAY) as { check_in: number; check_out: number | null }[];

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayMs = now.getTime();

  const byDay = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(r.check_in);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    const dur = r.check_out ? Math.round((r.check_out - r.check_in) / 60000) : 40;
    byDay.set(key, Math.max(byDay.get(key) ?? 0, dur));
  }

  const history: AttendanceCell[] = [];
  for (let i = 55; i >= 0; i--) {
    const d = new Date(todayMs - i * DAY);
    const key = d.toISOString().slice(0, 10);
    const mins = byDay.get(key) ?? 0;
    history.push({ date: key, intensity: intensityForMinutes(mins) });
  }

  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].intensity > 0) streak++;
    else break;
  }

  const weekly = history.slice(-7).filter((c) => c.intensity > 0).length;
  const totalLast8Weeks = history.filter((c) => c.intensity > 0).length;

  const openRow = db
    .prepare(
      "SELECT id, check_in FROM sessions WHERE member_id = ? AND check_out IS NULL ORDER BY check_in DESC LIMIT 1"
    )
    .get(memberId) as { id: number; check_in: number } | undefined;

  return {
    history,
    streak,
    weekly,
    totalLast8Weeks,
    checkedInToday: !!openRow,
    openSessionId: openRow?.id ?? null,
    checkInTime: openRow?.check_in ?? null,
  };
}
