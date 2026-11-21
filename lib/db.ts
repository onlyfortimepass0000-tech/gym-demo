// In-memory store with a prepare(sql).get/all/run surface compatible with how
// the app's routes and pages call it. We swapped off better-sqlite3 so the app
// works on serverless (Vercel), where native modules + a writable FS aren't
// available. State lives on globalThis so it survives dev HMR and persists for
// the warm life of a serverless instance — plenty for a pitch demo.

type Member = { id: number; name: string; streak: number; plan: string };
type Session = {
  id: number;
  member_id: number;
  check_in: number;
  check_out: number | null;
};
type NutritionRow = {
  member_id: number;
  goal: string;
  diet: string;
  weight: number;
  activity: string;
  meals: string;
  kcal: number;
  macros: string;
  meal_plan: string;
};
type BeginnerRow = {
  member_id: number;
  experience: string;
  days: number;
  focus: string;
  limits: string;
  equipment: string;
  plan: string;
};
type ClientRow = {
  id: number;
  name: string;
  plan: string;
  adherence: number;
  status: string;
  last_seen: string;
  progress: number;
  risk: string;
  prs: number;
};

type Store = {
  members: Member[];
  sessions: Session[];
  nextSessionId: number;
  nutrition: NutritionRow[];
  beginner: BeginnerRow[];
  clients: ClientRow[];
  seeded: boolean;
};

const g = globalThis as unknown as { __kiloStore?: Store };

function getStore(): Store {
  if (!g.__kiloStore) {
    g.__kiloStore = {
      members: [],
      sessions: [],
      nextSessionId: 1,
      nutrition: [],
      beginner: [],
      clients: [],
      seeded: false,
    };
    seed(g.__kiloStore);
  }
  return g.__kiloStore;
}

function seed(s: Store) {
  if (s.seeded) return;
  s.members.push({ id: 1, name: "Aryan", streak: 11, plan: "Monthly" });

  const DAY = 86400000;
  const now = Date.now();
  for (let i = 55; i >= 1; i--) {
    const r = Math.random();
    let intensity = 0;
    if (r > 0.45) intensity = 1;
    if (r > 0.65) intensity = 2;
    if (r > 0.85) intensity = 3;
    const d = new Date(now - i * DAY);
    if (d.getDay() === 0 && Math.random() > 0.3) intensity = 0;
    if (intensity > 0) {
      const inTs = d.setHours(
        17 + Math.floor(Math.random() * 4),
        Math.floor(Math.random() * 60),
        0,
        0
      );
      const duration = 30 + intensity * 15 + Math.floor(Math.random() * 15);
      s.sessions.push({
        id: s.nextSessionId++,
        member_id: 1,
        check_in: inTs,
        check_out: inTs + duration * 60000,
      });
    }
  }

  const clients: Omit<ClientRow, "id">[] = [
    { name: "Aryan M.", plan: "Push/Pull/Legs", adherence: 88, status: "in", last_seen: "2h ago", progress: 72, risk: "low", prs: 3 },
    { name: "Priya S.", plan: "Beginner · 3d", adherence: 94, status: "in", last_seen: "40m ago", progress: 58, risk: "low", prs: 2 },
    { name: "Rohan K.", plan: "Full body · 4d", adherence: 62, status: "out", last_seen: "3d ago", progress: 41, risk: "medium", prs: 1 },
    { name: "Ishita D.", plan: "Strength 5x5", adherence: 76, status: "out", last_seen: "Yesterday", progress: 65, risk: "low", prs: 4 },
    { name: "Vikram J.", plan: "Fat loss · 5d", adherence: 48, status: "out", last_seen: "6d ago", progress: 28, risk: "high", prs: 0 },
    { name: "Neha R.", plan: "Beginner · 3d", adherence: 90, status: "in", last_seen: "15m ago", progress: 51, risk: "low", prs: 2 },
    { name: "Aditya P.", plan: "Hypertrophy", adherence: 71, status: "out", last_seen: "Yesterday", progress: 60, risk: "medium", prs: 1 },
  ];
  let cid = 1;
  for (const c of clients) s.clients.push({ id: cid++, ...c });

  s.seeded = true;
}

type RunResult = { changes: number; lastInsertRowid: number };
type Stmt = {
  get(...args: unknown[]): unknown;
  all(...args: unknown[]): unknown[];
  run(...args: unknown[]): RunResult;
};

function norm(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

export function getDb() {
  const store = getStore();
  return {
    prepare(sql: string): Stmt {
      return makeStmt(norm(sql), store);
    },
  };
}

function makeStmt(sql: string, s: Store): Stmt {
  const noop: Stmt = {
    get: () => undefined,
    all: () => [],
    run: () => ({ changes: 0, lastInsertRowid: 0 }),
  };

  if (sql.startsWith("SELECT name FROM members WHERE id =")) {
    return { ...noop, get: (id) => s.members.find((m) => m.id === id) };
  }

  if (
    sql.startsWith(
      "SELECT goal, diet, weight, activity, meals, kcal, macros, meal_plan FROM nutrition_plans WHERE member_id ="
    )
  ) {
    return { ...noop, get: (mid) => s.nutrition.find((n) => n.member_id === mid) };
  }

  if (
    sql.startsWith(
      "SELECT experience, days, focus, limits, equipment, plan FROM beginner_plans WHERE member_id ="
    )
  ) {
    return { ...noop, get: (mid) => s.beginner.find((n) => n.member_id === mid) };
  }

  if (sql === "SELECT id FROM sessions WHERE member_id = ? AND check_out IS NULL") {
    return {
      ...noop,
      get: (mid) => {
        const row = s.sessions.find((x) => x.member_id === mid && x.check_out === null);
        return row ? { id: row.id } : undefined;
      },
    };
  }

  if (
    sql ===
    "SELECT id, check_in FROM sessions WHERE member_id = ? AND check_out IS NULL ORDER BY check_in DESC LIMIT 1"
  ) {
    return {
      ...noop,
      get: (mid) => {
        const rows = s.sessions
          .filter((x) => x.member_id === mid && x.check_out === null)
          .sort((a, b) => b.check_in - a.check_in);
        return rows.length ? { id: rows[0].id, check_in: rows[0].check_in } : undefined;
      },
    };
  }

  if (
    sql ===
    "SELECT id, name, plan, adherence, status, last_seen, progress, risk, prs FROM clients ORDER BY id"
  ) {
    return {
      ...noop,
      all: () => s.clients.slice().sort((a, b) => a.id - b.id),
    };
  }

  if (sql === "SELECT check_in FROM sessions WHERE check_in >= ? AND check_in < ?") {
    return {
      ...noop,
      all: (a, b) =>
        s.sessions
          .filter((x) => x.check_in >= (a as number) && x.check_in < (b as number))
          .map((x) => ({ check_in: x.check_in })),
    };
  }

  if (sql === "SELECT check_in FROM sessions WHERE check_in >= ?") {
    return {
      ...noop,
      all: (a) =>
        s.sessions
          .filter((x) => x.check_in >= (a as number))
          .map((x) => ({ check_in: x.check_in })),
    };
  }

  if (
    sql ===
    "SELECT check_in, check_out FROM sessions WHERE member_id = ? AND check_in >= ? ORDER BY check_in ASC"
  ) {
    return {
      ...noop,
      all: (mid, a) =>
        s.sessions
          .filter((x) => x.member_id === mid && x.check_in >= (a as number))
          .sort((p, q) => p.check_in - q.check_in)
          .map((x) => ({ check_in: x.check_in, check_out: x.check_out })),
    };
  }

  if (sql === "INSERT INTO sessions (member_id, check_in) VALUES (?, ?)") {
    return {
      ...noop,
      run: (mid, checkIn) => {
        const id = s.nextSessionId++;
        s.sessions.push({
          id,
          member_id: mid as number,
          check_in: checkIn as number,
          check_out: null,
        });
        return { changes: 1, lastInsertRowid: id };
      },
    };
  }

  if (sql.startsWith("INSERT INTO nutrition_plans")) {
    return {
      ...noop,
      run: (mid, goal, diet, weight, activity, meals, kcal, macros, meal_plan) => {
        const idx = s.nutrition.findIndex((n) => n.member_id === mid);
        const row: NutritionRow = {
          member_id: mid as number,
          goal: goal as string,
          diet: diet as string,
          weight: weight as number,
          activity: activity as string,
          meals: meals as string,
          kcal: kcal as number,
          macros: macros as string,
          meal_plan: meal_plan as string,
        };
        if (idx >= 0) s.nutrition[idx] = row;
        else s.nutrition.push(row);
        return { changes: 1, lastInsertRowid: mid as number };
      },
    };
  }

  if (sql.startsWith("INSERT INTO beginner_plans")) {
    return {
      ...noop,
      run: (mid, experience, days, focus, limits, equipment, plan) => {
        const idx = s.beginner.findIndex((n) => n.member_id === mid);
        const row: BeginnerRow = {
          member_id: mid as number,
          experience: experience as string,
          days: days as number,
          focus: focus as string,
          limits: limits as string,
          equipment: equipment as string,
          plan: plan as string,
        };
        if (idx >= 0) s.beginner[idx] = row;
        else s.beginner.push(row);
        return { changes: 1, lastInsertRowid: mid as number };
      },
    };
  }

  if (sql === "UPDATE sessions SET check_out = ? WHERE id = ?") {
    return {
      ...noop,
      run: (checkOut, id) => {
        const row = s.sessions.find((x) => x.id === id);
        if (row) {
          row.check_out = checkOut as number;
          return { changes: 1, lastInsertRowid: 0 };
        }
        return { changes: 0, lastInsertRowid: 0 };
      },
    };
  }

  if (sql === "DELETE FROM nutrition_plans WHERE member_id = ?") {
    return {
      ...noop,
      run: (mid) => {
        const before = s.nutrition.length;
        s.nutrition = s.nutrition.filter((n) => n.member_id !== mid);
        return { changes: before - s.nutrition.length, lastInsertRowid: 0 };
      },
    };
  }

  if (sql === "DELETE FROM beginner_plans WHERE member_id = ?") {
    return {
      ...noop,
      run: (mid) => {
        const before = s.beginner.length;
        s.beginner = s.beginner.filter((n) => n.member_id !== mid);
        return { changes: before - s.beginner.length, lastInsertRowid: 0 };
      },
    };
  }

  throw new Error("Unknown SQL: " + sql);
}

export const CURRENT_MEMBER_ID = 1;
