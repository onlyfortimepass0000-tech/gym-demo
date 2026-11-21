import CheckInHero from "@/components/CheckInHero";
import Heatmap, { HeatmapLegend } from "@/components/Heatmap";
import NutritionCard from "@/components/NutritionCard";
import WorkoutTable from "@/components/WorkoutTable";
import { getAttendance } from "@/lib/attendance";
import { CURRENT_MEMBER_ID, getDb } from "@/lib/db";
import type { NutritionRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getNutrition(): Promise<NutritionRecord | null> {
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
  if (!row) return null;
  return {
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
}

export default async function MemberPage() {
  const db = getDb();
  const member = db
    .prepare("SELECT name FROM members WHERE id = ?")
    .get(CURRENT_MEMBER_ID) as { name: string };
  const attendance = getAttendance();
  const nutrition = await getNutrition();

  const workout = [
    { name: "Barbell bench press", sets: 4, reps: "8–10", rest: "90s" },
    { name: "Incline dumbbell press", sets: 3, reps: "10–12", rest: "75s" },
    { name: "Seated shoulder press", sets: 3, reps: "10", rest: "75s" },
    { name: "Cable lateral raise", sets: 3, reps: "12–15", rest: "45s" },
    { name: "Tricep rope pushdown", sets: 3, reps: "12", rest: "45s" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <section className="lg:col-span-8">
        <CheckInHero
          name={member.name}
          checkedIn={attendance.checkedInToday}
          checkInTime={attendance.checkInTime}
          streak={attendance.streak}
        />
      </section>

      <section className="lg:col-span-4">
        <div className="card h-full">
          <div className="eyebrow">This week</div>
          <div className="mt-3 flex flex-col gap-4">
            <Stat label="Sessions" value={`${attendance.weekly}/5`} pct={(attendance.weekly / 5) * 100} />
            <Stat label="Avg session" value="52 min" pct={72} tone="warm" />
            <Stat label="Calories out" value="2,480 kcal" pct={60} tone="good" />
          </div>
        </div>
      </section>

      <section className="lg:col-span-6">
        <div className="card">
          <div className="mb-3.5 flex items-start justify-between gap-3">
            <div>
              <div className="eyebrow">Attendance calendar</div>
              <h3 className="mt-1 font-display text-lg font-semibold">Last 8 weeks</h3>
            </div>
            <HeatmapLegend />
          </div>
          <Heatmap history={attendance.history} />
          <div className="divider" />
          <div className="flex items-center justify-between">
            <span className="k">Total sessions · last 8 weeks</span>
            <span className="tabular font-semibold">{attendance.totalLast8Weeks}</span>
          </div>
        </div>
      </section>

      <section className="lg:col-span-6">
        <NutritionCard record={nutrition} />
      </section>

      <section className="lg:col-span-12">
        <div className="card">
          <div className="mb-3.5 flex items-start justify-between gap-3">
            <div>
              <div className="eyebrow">Today&apos;s workout</div>
              <h3 className="mt-1 font-display text-xl font-semibold">
                Push · chest, shoulders, triceps
              </h3>
            </div>
            <div className="pill">
              <span className="dot" style={{ color: "var(--warm)" }} /> 55 min · moderate
            </div>
          </div>
          <WorkoutTable items={workout} />
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  pct,
  tone,
}: {
  label: string;
  value: string;
  pct: number;
  tone?: "warm" | "good";
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="k">{label}</span>
        <span className="tabular font-semibold">{value}</span>
      </div>
      <div className={`bar mt-1.5 ${tone === "warm" ? "bar-warm" : tone === "good" ? "bar-good" : ""}`}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
