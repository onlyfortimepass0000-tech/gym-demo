import { NextRequest, NextResponse } from "next/server";
import { CURRENT_MEMBER_ID, getDb } from "@/lib/db";
import { buildNutritionPlan } from "@/lib/nutrition";
import type { NutritionAnswers, NutritionRecord } from "@/lib/types";

export async function GET() {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT goal, diet, weight, activity, meals, kcal, macros, meal_plan FROM nutrition_plans WHERE member_id = ?"
    )
    .get(CURRENT_MEMBER_ID) as
    | {
        goal: string;
        diet: string;
        weight: number;
        activity: string;
        meals: string;
        kcal: number;
        macros: string;
        meal_plan: string;
      }
    | undefined;

  if (!row) return NextResponse.json({ plan: null });
  const record: NutritionRecord = {
    goal: row.goal,
    diet: row.diet,
    weight: String(row.weight),
    activity: row.activity,
    meals: row.meals,
    plan: {
      title: `${row.goal} · ${row.diet}`,
      kcal: row.kcal,
      macros: JSON.parse(row.macros),
      meals: JSON.parse(row.meal_plan),
    },
  };
  return NextResponse.json(record);
}

export async function POST(req: NextRequest) {
  const answers = (await req.json()) as NutritionAnswers;
  const plan = buildNutritionPlan(answers);
  const db = getDb();
  db.prepare(
    `INSERT INTO nutrition_plans (member_id, goal, diet, weight, activity, meals, kcal, macros, meal_plan)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(member_id) DO UPDATE SET
       goal = excluded.goal, diet = excluded.diet, weight = excluded.weight,
       activity = excluded.activity, meals = excluded.meals, kcal = excluded.kcal,
       macros = excluded.macros, meal_plan = excluded.meal_plan`
  ).run(
    CURRENT_MEMBER_ID,
    answers.goal,
    answers.diet,
    parseFloat(answers.weight) || 68,
    answers.activity,
    answers.meals,
    plan.kcal,
    JSON.stringify(plan.macros),
    JSON.stringify(plan.meals)
  );
  return NextResponse.json({ ok: true, plan });
}

export async function DELETE() {
  const db = getDb();
  db.prepare("DELETE FROM nutrition_plans WHERE member_id = ?").run(CURRENT_MEMBER_ID);
  return NextResponse.json({ ok: true });
}
