import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const HOUR = 3600000;
const DAY = 86400000;

export async function GET() {
  const db = getDb();

  // Derive hourly check-ins for today from sessions (on the demo member).
  // Add seeded baseline so the chart reads full across the day.
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const todayStartMs = startOfDay.getTime();

  const rows = db
    .prepare(
      "SELECT check_in FROM sessions WHERE check_in >= ? AND check_in < ?"
    )
    .all(todayStartMs, todayStartMs + DAY) as { check_in: number }[];

  // 21 hour buckets from 6am to 2am next day
  const baseline = [20, 28, 35, 42, 48, 38, 25, 18, 12, 22, 55, 72, 65, 45, 38, 42, 68, 94, 88, 62, 40];
  const hours = [...baseline];
  for (const r of rows) {
    const d = new Date(r.check_in);
    const h = d.getHours();
    const idx = h >= 6 ? h - 6 : h + 18; // 6am = 0
    if (idx >= 0 && idx < hours.length) hours[idx] += 1;
  }

  const checkInsToday = hours.reduce((a, b) => a + b, 0);

  // Last 7 days of sessions for weekly bars
  const weeklyRows = db
    .prepare("SELECT check_in FROM sessions WHERE check_in >= ?")
    .all(Date.now() - 7 * DAY) as { check_in: number }[];
  const weeklyBuckets = [0, 0, 0, 0, 0, 0, 0];
  for (const r of weeklyRows) {
    const daysAgo = Math.floor((Date.now() - r.check_in) / DAY);
    if (daysAgo >= 0 && daysAgo < 7) weeklyBuckets[6 - daysAgo]++;
  }

  return NextResponse.json({
    kpis: {
      activeMembers: 284,
      checkInsToday,
      mrr: 480000,
      churnRisk: 14,
      deltaMembers: 12,
      deltaCheckIns: 18,
      deltaMrr: 6.2,
    },
    hourly: hours,
    weekly: weeklyBuckets,
    planMix: [
      { name: "Monthly · ₹2,500", count: 142, share: 0.5, tone: "accent" },
      { name: "Quarterly · ₹6,500", count: 84, share: 0.3, tone: "warm" },
      { name: "Annual · ₹22,000", count: 38, share: 0.13, tone: "good" },
      { name: "PT add-on", count: 20, share: 0.07, tone: "muted" },
    ],
    trainers: [
      { name: "Harish Barai", clients: 24, adh: 82, rev: 48000 },
      { name: "Saomik R.", clients: 18, adh: 76, rev: 36000 },
      { name: "Meera K.", clients: 21, adh: 88, rev: 42000 },
      { name: "Devansh T.", clients: 12, adh: 64, rev: 24000 },
    ],
  });
}
