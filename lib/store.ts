"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { NutritionPlan, TrainingPlan } from "./types";
import type { Session } from "./seed";
import { dayKey } from "./dates";

export type SetEntry = { done: boolean; load?: number };
export type WorkoutLog = {
  id: string;
  memberId: string;
  day: string;
  planSessionId: string;
  exerciseId: string;
  sets: SetEntry[];
  at: number;
};
export type Message = {
  id: string;
  memberId: string;
  fromName: string;
  fromRole: "trainer" | "owner";
  body: string;
  at: number;
  read: boolean;
};
export type WeightLog = { memberId: string; day: string; kg: number };

export type Persisted = {
  v: 2;
  sessions: Session[];
  plans: Record<string, TrainingPlan>;
  nutrition: Record<string, NutritionPlan>;
  logs: WorkoutLog[];
  weights: WeightLog[];
  messages: Message[];
  assignments: Record<string, string>; // signupId -> trainerId
  reminders: string[]; // memberIds already reminded
};

const KEY = "kilo-demo-v2";
let cache: Persisted | null = null;
const listeners = new Set<() => void>();

function initial(): Persisted {
  return { v: 2, sessions: [], plans: {}, nutrition: {}, logs: [], weights: [], messages: [], assignments: {}, reminders: [] };
}

function read(): Persisted {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Persisted;
      if (parsed && parsed.v === 2) {
        cache = parsed;
        return cache;
      }
    }
  } catch {
    // storage blocked or corrupt: fall through to an in-memory store
  }
  cache = initial();
  return cache;
}

function commit(next: Persisted) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // keep working in memory
  }
  listeners.forEach((l) => l());
}

function update(fn: (s: Persisted) => Persisted) {
  commit(fn(read()));
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = (): Persisted => read();
const getServerSnapshot = (): Persisted | null => null;

export function useStore(): Persisted | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useNow(intervalMs = 15000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// ---------- actions ----------
export function checkIn(memberId: string) {
  update((s) => {
    if (s.sessions.some((x) => x.memberId === memberId && x.checkOut === null)) return s;
    const session: Session = { id: uid("app"), memberId, checkIn: Date.now(), checkOut: null, source: "app" };
    return { ...s, sessions: [...s.sessions, session] };
  });
}

export function checkOut(memberId: string) {
  update((s) => ({
    ...s,
    sessions: s.sessions.map((x) =>
      x.memberId === memberId && x.checkOut === null ? { ...x, checkOut: Date.now() } : x,
    ),
  }));
}

export function savePlan(memberId: string, plan: TrainingPlan) {
  update((s) => ({ ...s, plans: { ...s.plans, [memberId]: plan } }));
}

export function saveNutrition(memberId: string, plan: NutritionPlan) {
  update((s) => ({ ...s, nutrition: { ...s.nutrition, [memberId]: plan } }));
}

export function setLogEntry(
  memberId: string,
  planSessionId: string,
  exerciseId: string,
  totalSets: number,
  index: number,
  patch: Partial<SetEntry>,
) {
  const day = dayKey(Date.now());
  update((s) => {
    const existing = s.logs.find(
      (l) => l.memberId === memberId && l.day === day && l.planSessionId === planSessionId && l.exerciseId === exerciseId,
    );
    const base: WorkoutLog = existing ?? {
      id: uid("log"), memberId, day, planSessionId, exerciseId,
      sets: Array.from({ length: totalSets }, () => ({ done: false })),
      at: Date.now(),
    };
    const sets = base.sets.slice();
    while (sets.length < totalSets) sets.push({ done: false });
    sets[index] = { ...sets[index], ...patch };
    const next: WorkoutLog = { ...base, sets, at: Date.now() };
    return { ...s, logs: existing ? s.logs.map((l) => (l.id === existing.id ? next : l)) : [...s.logs, next] };
  });
}

export function logWeight(memberId: string, kg: number) {
  const day = dayKey(Date.now());
  update((s) => ({
    ...s,
    weights: [...s.weights.filter((w) => !(w.memberId === memberId && w.day === day)), { memberId, day, kg }],
  }));
}

export function sendMessage(m: { memberId: string; fromName: string; fromRole: "trainer" | "owner"; body: string }) {
  update((s) => ({
    ...s,
    messages: [...s.messages, { id: uid("msg"), ...m, at: Date.now(), read: false }],
  }));
}

export function markMessagesRead(memberId: string) {
  update((s) => ({
    ...s,
    messages: s.messages.map((m) => (m.memberId === memberId && !m.read ? { ...m, read: true } : m)),
  }));
}

export function assignSignup(signupId: string, trainerId: string) {
  update((s) => ({ ...s, assignments: { ...s.assignments, [signupId]: trainerId } }));
}

export function sendReminders(memberIds: string[], fromName: string, body: string) {
  update((s) => {
    const fresh = memberIds.filter((id) => !s.reminders.includes(id));
    const now = Date.now();
    return {
      ...s,
      reminders: [...s.reminders, ...fresh],
      messages: [
        ...s.messages,
        ...fresh.map((memberId) => ({
          id: uid("msg"), memberId, fromName, fromRole: "owner" as const, body, at: now, read: false,
        })),
      ],
    };
  });
}

export function resetDemo() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  commit(initial());
}
