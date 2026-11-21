import { NextRequest, NextResponse } from "next/server";
import { CURRENT_MEMBER_ID, getDb } from "@/lib/db";
import { buildBeginnerPlan } from "@/lib/beginner";
import type { BeginnerAnswers, BeginnerRecord } from "@/lib/types";

export async function GET() {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT experience, days, focus, limits, equipment, plan FROM beginner_plans WHERE member_id = ?"
    )
    .get(CURRENT_MEMBER_ID) as
    | {
        experience: string;
        days: number;
        focus: string;
        limits: string;
        equipment: string;
        plan: string;
      }
    | undefined;

  if (!row) return NextResponse.json({ plan: null });
  const record: BeginnerRecord = {
    experience: row.experience,
    days: `${row.days} days`,
    focus: row.focus,
    limits: row.limits,
    equipment: row.equipment,
    plan: JSON.parse(row.plan),
  };
  return NextResponse.json(record);
}

export async function POST(req: NextRequest) {
  const answers = (await req.json()) as BeginnerAnswers;
  const plan = buildBeginnerPlan(answers);
  const db = getDb();
  db.prepare(
    `INSERT INTO beginner_plans (member_id, experience, days, focus, limits, equipment, plan)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(member_id) DO UPDATE SET
       experience = excluded.experience, days = excluded.days, focus = excluded.focus,
       limits = excluded.limits, equipment = excluded.equipment, plan = excluded.plan`
  ).run(
    CURRENT_MEMBER_ID,
    answers.experience,
    parseInt(answers.days) || 3,
    answers.focus,
    answers.limits,
    answers.equipment,
    JSON.stringify(plan)
  );
  return NextResponse.json({ ok: true, plan });
}

export async function DELETE() {
  const db = getDb();
  db.prepare("DELETE FROM beginner_plans WHERE member_id = ?").run(CURRENT_MEMBER_ID);
  return NextResponse.json({ ok: true });
}
