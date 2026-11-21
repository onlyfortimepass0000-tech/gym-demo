import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "kilo.db");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  init(_db);
  return _db;
}

function init(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      streak INTEGER NOT NULL DEFAULT 0,
      plan TEXT
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      check_in INTEGER NOT NULL,
      check_out INTEGER
    );
    CREATE TABLE IF NOT EXISTS nutrition_plans (
      member_id INTEGER PRIMARY KEY,
      goal TEXT, diet TEXT, weight REAL, activity TEXT, meals TEXT,
      kcal INTEGER, macros TEXT, meal_plan TEXT
    );
    CREATE TABLE IF NOT EXISTS beginner_plans (
      member_id INTEGER PRIMARY KEY,
      experience TEXT, days INTEGER, focus TEXT, limits TEXT, equipment TEXT,
      plan TEXT
    );
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      plan TEXT,
      adherence INTEGER,
      status TEXT,
      last_seen TEXT,
      progress INTEGER,
      risk TEXT,
      prs INTEGER
    );
  `);

  const memberCount = db.prepare("SELECT COUNT(*) AS c FROM members").get() as { c: number };
  if (memberCount.c === 0) seed(db);
}

function seed(db: Database.Database) {
  db.prepare("INSERT INTO members (id, name, streak, plan) VALUES (?, ?, ?, ?)")
    .run(1, "Aryan", 11, "Monthly");

  // Seed ~56 days of sessions with the density pattern from app.html
  const DAY = 86400000;
  const now = Date.now();
  const insertSession = db.prepare(
    "INSERT INTO sessions (member_id, check_in, check_out) VALUES (?, ?, ?)"
  );
  for (let i = 55; i >= 1; i--) {
    const r = Math.random();
    let intensity = 0;
    if (r > 0.45) intensity = 1;
    if (r > 0.65) intensity = 2;
    if (r > 0.85) intensity = 3;
    const d = new Date(now - i * DAY);
    if (d.getDay() === 0 && Math.random() > 0.3) intensity = 0;
    if (intensity > 0) {
      const inTs = d.setHours(17 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60), 0, 0);
      const durationMin = 30 + intensity * 15 + Math.floor(Math.random() * 15);
      const outTs = inTs + durationMin * 60000;
      insertSession.run(1, inTs, outTs);
    }
  }

  const insertClient = db.prepare(
    "INSERT INTO clients (name, plan, adherence, status, last_seen, progress, risk, prs) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const clients = [
    ["Aryan M.", "Push/Pull/Legs", 88, "in", "2h ago", 72, "low", 3],
    ["Priya S.", "Beginner · 3d", 94, "in", "40m ago", 58, "low", 2],
    ["Rohan K.", "Full body · 4d", 62, "out", "3d ago", 41, "medium", 1],
    ["Ishita D.", "Strength 5x5", 76, "out", "Yesterday", 65, "low", 4],
    ["Vikram J.", "Fat loss · 5d", 48, "out", "6d ago", 28, "high", 0],
    ["Neha R.", "Beginner · 3d", 90, "in", "15m ago", 51, "low", 2],
    ["Aditya P.", "Hypertrophy", 71, "out", "Yesterday", 60, "medium", 1],
  ] as const;
  for (const c of clients) insertClient.run(...c);
}

export const CURRENT_MEMBER_ID = 1;
