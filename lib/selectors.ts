import type { NutritionPlan, PlannedSession, TrainingPlan } from "./types";
import { generateTrainingPlan } from "./workout-engine";
import { generateNutritionPlan } from "./nutrition-engine";
import type { Persisted, WorkoutLog } from "./store";
import {
  SEED_MEMBERS, SEED_SIGNUPS, WEEKDAYS_BY_DAYS, generatedSessions, nutritionIntakeFor, trainingIntakeFor,
  type Member, type Session, type Signup,
} from "./seed";
import { PLAN_PRICES } from "./brand";
import { DAY, addDays, dayKey, startOfDay } from "./dates";
import { rnd } from "./prng";

export type Ctx = { store: Persisted; now: number };

// ---------- members ----------
export function pendingSignups(ctx: Ctx): Signup[] {
  return SEED_SIGNUPS.filter((s) => !ctx.store.assignments[s.id]);
}

function signupToMember(s: Signup, trainerId: string): Member {
  return {
    id: s.id, name: s.name, sex: s.sex, age: 24, heightCm: s.sex === "male" ? 172 : 160,
    weightKg: s.sex === "male" ? 70 : 58, tier: s.tier, joinedDaysAgo: s.daysAgo, renewsInDays: 30,
    trainerId, goal: "general", experience: "never", daysPerWeek: 3, limitations: [],
    attendance: 0, hour: 18, lapsedDays: 0, persona: false, blank: true, seedNutrition: false, diet: "veg",
  };
}

export function allMembers(ctx: Ctx): Member[] {
  const extra = SEED_SIGNUPS.filter((s) => ctx.store.assignments[s.id]).map((s) =>
    signupToMember(s, ctx.store.assignments[s.id]),
  );
  return [...SEED_MEMBERS, ...extra];
}

export function memberById(ctx: Ctx, id: string): Member | undefined {
  return allMembers(ctx).find((m) => m.id === id);
}

// ---------- plans ----------
const derivedPlans = new Map<string, TrainingPlan>();
const derivedNutrition = new Map<string, NutritionPlan>();

export function planOf(ctx: Ctx, m: Member): TrainingPlan | undefined {
  const stored = ctx.store.plans[m.id];
  if (stored) return stored;
  if (m.blank) return undefined;
  let p = derivedPlans.get(m.id);
  if (!p) {
    p = generateTrainingPlan(trainingIntakeFor(m));
    derivedPlans.set(m.id, p);
  }
  return p;
}

export function nutritionOf(ctx: Ctx, m: Member): NutritionPlan | undefined {
  const stored = ctx.store.nutrition[m.id];
  if (stored) return stored;
  if (!m.seedNutrition) return undefined;
  let p = derivedNutrition.get(m.id);
  if (!p) {
    p = generateNutritionPlan(nutritionIntakeFor(m));
    derivedNutrition.set(m.id, p);
  }
  return p;
}

export function plannedWeekdays(ctx: Ctx, m: Member): number[] {
  const p = planOf(ctx, m);
  if (p) return p.weekdays;
  return m.blank ? [] : WEEKDAYS_BY_DAYS[m.daysPerWeek];
}

export function planStartDay(ctx: Ctx, m: Member): number {
  const joined = startOfDay(ctx.now) - m.joinedDaysAgo * DAY;
  const stored = ctx.store.plans[m.id];
  return stored ? Math.max(joined, startOfDay(stored.createdAt)) : joined;
}

export function sessionForWeekday(plan: TrainingPlan | undefined, weekday: number): PlannedSession | undefined {
  return plan?.sessions.find((s) => s.weekday === weekday);
}

// ---------- sessions & attendance ----------
export function sessionsOf(ctx: Ctx, m: Member): Session[] {
  const generated = generatedSessions(m, ctx.now);
  const own = ctx.store.sessions.filter((s) => s.memberId === m.id);
  return [...generated, ...own].sort((a, b) => a.checkIn - b.checkIn);
}

export function openSession(sessions: Session[]): Session | undefined {
  return sessions.find((s) => s.checkOut === null);
}

export type DayStatus = "attended" | "inside" | "missed" | "planned" | "rest" | "pre";
export type DayInfo = {
  key: string;
  ts: number;
  status: DayStatus;
  sessions: Session[];
  planned?: PlannedSession;
};

export function dayInfo(ctx: Ctx, m: Member, ts: number, byDay: Map<string, Session[]>): DayInfo {
  const day = startOfDay(ts);
  const today = startOfDay(ctx.now);
  const key = dayKey(day);
  const sessions = byDay.get(key) ?? [];
  const weekdays = plannedWeekdays(ctx, m);
  const isPlanned = weekdays.includes(new Date(day).getDay());
  const plan = planOf(ctx, m);
  const planned = isPlanned ? sessionForWeekday(plan, new Date(day).getDay()) : undefined;
  const joined = startOfDay(ctx.now) - m.joinedDaysAgo * DAY;
  const start = planStartDay(ctx, m);

  let status: DayStatus;
  if (sessions.length > 0) {
    status = sessions.some((s) => s.checkOut === null) && day === today ? "inside" : "attended";
  } else if (day < joined) {
    status = "pre";
  } else if (day >= today) {
    status = isPlanned ? "planned" : "rest";
  } else {
    status = isPlanned && day >= start ? "missed" : "rest";
  }
  return { key, ts: day, status, sessions, planned };
}

export function groupByDay(sessions: Session[]): Map<string, Session[]> {
  const map = new Map<string, Session[]>();
  for (const s of sessions) {
    const k = dayKey(s.checkIn);
    const arr = map.get(k);
    if (arr) arr.push(s);
    else map.set(k, [s]);
  }
  return map;
}

export type Adherence = { planned: number; attended: number; extra: number; pct: number | null };

export function adherence(ctx: Ctx, m: Member, sessions: Session[], days = 28): Adherence {
  const byDay = groupByDay(sessions);
  const today = startOfDay(ctx.now);
  let planned = 0;
  let attended = 0;
  let extra = 0;
  for (let i = days; i >= 0; i--) {
    const d = addDays(today, -i);
    const info = dayInfo(ctx, m, d, byDay);
    if (info.status === "attended" || info.status === "inside") {
      if (plannedWeekdays(ctx, m).includes(new Date(d).getDay()) && d >= planStartDay(ctx, m)) {
        planned++;
        attended++;
      } else extra++;
    } else if (info.status === "missed") planned++;
  }
  return { planned, attended, extra, pct: planned === 0 ? null : Math.round((attended / planned) * 100) };
}

export function currentStreak(ctx: Ctx, m: Member, sessions: Session[]): number {
  const byDay = groupByDay(sessions);
  const today = startOfDay(ctx.now);
  let streak = 0;
  for (let i = 0; i <= 150; i++) {
    const d = addDays(today, -i);
    const info = dayInfo(ctx, m, d, byDay);
    if (info.status === "attended" || info.status === "inside") streak++;
    else if (info.status === "missed") break;
    else if (info.status === "pre") break;
  }
  return streak;
}

export type Risk = "new" | "ok" | "watch" | "risk";

export function daysSinceLastVisit(ctx: Ctx, sessions: Session[]): number | null {
  const last = sessions[sessions.length - 1];
  if (!last) return null;
  return Math.round((startOfDay(ctx.now) - startOfDay(last.checkIn)) / DAY);
}

export function riskOf(ctx: Ctx, m: Member, sessions: Session[]): Risk {
  const since = daysSinceLastVisit(ctx, sessions);
  if (since === null) return m.joinedDaysAgo <= 7 ? "new" : "risk";
  if (since >= 10) return "risk";
  if (since >= 5) return "watch";
  return "ok";
}

export function weeklyCounts(ctx: Ctx, sessions: Session[], weeks = 8): { start: number; count: number }[] {
  const today = startOfDay(ctx.now);
  const mondayOffset = (new Date(today).getDay() + 6) % 7;
  const thisMonday = addDays(today, -mondayOffset);
  const out: { start: number; count: number }[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const start = addDays(thisMonday, -7 * w);
    const end = addDays(start, 7);
    const count = new Set(
      sessions.filter((s) => s.checkIn >= start && s.checkIn < end).map((s) => dayKey(s.checkIn)),
    ).size;
    out.push({ start, count });
  }
  return out;
}

export function logsFor(ctx: Ctx, memberId: string, day?: string): WorkoutLog[] {
  return ctx.store.logs.filter((l) => l.memberId === memberId && (day ? l.day === day : true));
}

// ---------- weight ----------
export function weightSeries(ctx: Ctx, m: Member): { day: string; kg: number; ts: number }[] {
  const out = new Map<string, number>();
  if (!m.blank) {
    const today = startOfDay(ctx.now);
    const drift = m.goal === "fat-loss" ? -0.28 : m.goal === "muscle" ? 0.16 : 0;
    for (let w = 9; w >= 1; w--) {
      const d = addDays(today, -7 * w);
      const noise = (rnd(`${m.id}:w:${w}`) - 0.5) * 0.5;
      out.set(dayKey(d), Math.round((m.weightKg - drift * w + noise) * 10) / 10);
    }
  }
  for (const w of ctx.store.weights) if (w.memberId === m.id) out.set(w.day, w.kg);
  return [...out.entries()]
    .map(([day, kg]) => ({ day, kg, ts: new Date(day + "T00:00:00").getTime() }))
    .sort((a, b) => a.ts - b.ts);
}

// ---------- business ----------
export function daysToRenewal(ctx: Ctx, m: Member): number {
  const cycle = m.tier === "Monthly" ? 30 : m.tier === "Quarterly" ? 90 : 365;
  const epochDay = Math.floor(startOfDay(ctx.now) / DAY);
  return ((m.renewsInDays - (epochDay % cycle)) % cycle + cycle) % cycle;
}

export function monthlyValue(m: Member): number {
  const p = PLAN_PRICES[m.tier];
  return p.price / p.months;
}

export function hourlyCheckIns(sessions: Session[], dayTs: number, fromHour = 5, toHour = 22): number[] {
  const out = new Array(toHour - fromHour + 1).fill(0);
  const key = dayKey(dayTs);
  for (const s of sessions) {
    if (dayKey(s.checkIn) !== key) continue;
    const h = new Date(s.checkIn).getHours();
    if (h >= fromHour && h <= toHour) out[h - fromHour]++;
  }
  return out;
}

export type FeedItem = { ts: number; memberId: string; text: string };

export function activityFeed(ctx: Ctx, members: Member[], limit = 14): FeedItem[] {
  const items: FeedItem[] = [];
  const cutoff = ctx.now - DAY;
  const names = new Map(members.map((m) => [m.id, m]));
  for (const m of members) {
    for (const s of sessionsOf(ctx, m)) {
      if (s.checkIn >= cutoff && s.checkIn <= ctx.now) items.push({ ts: s.checkIn, memberId: m.id, text: "checked in" });
      if (s.checkOut && s.checkOut >= cutoff && s.checkOut <= ctx.now) {
        items.push({ ts: s.checkOut, memberId: m.id, text: "checked out" });
      }
    }
  }
  for (const l of ctx.store.logs) {
    const m = names.get(l.memberId);
    if (!m || l.at < cutoff) continue;
    const done = l.sets.filter((s) => s.done).length;
    if (done > 0) items.push({ ts: l.at, memberId: l.memberId, text: `logged ${done}/${l.sets.length} sets` });
  }
  return items.sort((a, b) => b.ts - a.ts).slice(0, limit);
}
