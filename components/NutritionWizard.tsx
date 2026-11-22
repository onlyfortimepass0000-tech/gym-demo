"use client";
import { useState } from "react";
import type { Activity, Avoid, Diet, NutritionGoal, NutritionIntake, NutritionPlan } from "@/lib/types";
import { generateNutritionPlan } from "@/lib/nutrition-engine";
import Wizard, { type WizardStep } from "./Wizard";

const GOALS: { v: NutritionGoal; title: string; sub: string }[] = [
  { v: "fat-loss", title: "Lose fat", sub: "About 20% below what you burn, protein kept high." },
  { v: "muscle", title: "Build muscle", sub: "About 10% above what you burn." },
  { v: "recomp", title: "Lose fat and build muscle", sub: "Slightly under maintenance with high protein." },
  { v: "maintain", title: "Maintain weight", sub: "Eat what you burn." },
];

const DIETS: { v: Diet; title: string; sub: string }[] = [
  { v: "veg", title: "Vegetarian", sub: "Dairy yes, egg and meat no." },
  { v: "egg", title: "Eggetarian", sub: "Vegetarian plus eggs." },
  { v: "nonveg", title: "Non-vegetarian", sub: "Chicken, fish and eggs included." },
  { v: "vegan", title: "Vegan", sub: "No dairy, egg or honey." },
  { v: "jain", title: "Jain", sub: "No egg, meat or root vegetables." },
];

const AVOID: { v: Avoid; label: string }[] = [
  { v: "dairy", label: "Dairy" },
  { v: "nuts", label: "Nuts" },
  { v: "soy", label: "Soy" },
  { v: "gluten", label: "Gluten" },
];

const ACTIVITY: { v: Activity; title: string; sub: string }[] = [
  { v: "sedentary", title: "Desk job", sub: "Mostly sitting. Under about 5,000 steps a day." },
  { v: "light", title: "On my feet a few hours", sub: "Teaching, retail or about 8,000 steps a day." },
  { v: "moderate", title: "Active job or daily walks", sub: "10,000 or more steps, or hands-on work." },
  { v: "high", title: "Physical job or two-a-days", sub: "Manual work, sport, or training twice a day." },
];

const MEALS = [3, 4, 5] as const;

type BodyErrors = { age?: string; height?: string; weight?: string };

function bodyErrors(age: string, height: string, weight: string): BodyErrors {
  const out: BodyErrors = {};
  const a = Number(age);
  const h = Number(height);
  const w = Number(weight);
  if (age.trim() === "" || !Number.isFinite(a) || !Number.isInteger(a) || a < 14 || a > 80) out.age = "Enter an age from 14 to 80.";
  if (height.trim() === "" || !Number.isFinite(h) || h < 120 || h > 230) out.height = "Enter a height from 120 to 230 cm.";
  if (weight.trim() === "" || !Number.isFinite(w) || w < 30 || w > 200) out.weight = "Enter a weight from 30 to 200 kg.";
  return out;
}

export default function NutritionWizard({
  initial,
  forName,
  onDone,
  onClose,
}: {
  initial?: Partial<NutritionIntake>;
  forName?: string;
  onDone: (plan: NutritionPlan) => void;
  onClose: () => void;
}) {
  const [goal, setGoal] = useState<NutritionGoal | null>(initial?.goal ?? null);
  const [diet, setDiet] = useState<Diet | null>(initial?.diet ?? null);
  const [avoid, setAvoid] = useState<Avoid[]>(initial?.avoid ?? []);
  const [sex, setSex] = useState<"male" | "female" | null>(initial?.sex ?? null);
  const [age, setAge] = useState(initial?.age ? String(initial.age) : "");
  const [height, setHeight] = useState(initial?.heightCm ? String(initial.heightCm) : "");
  const [weight, setWeight] = useState(initial?.weightKg ? String(initial.weightKg) : "");
  const [showBodyErrors, setShowBodyErrors] = useState(false);
  const [activity, setActivity] = useState<Activity | null>(initial?.activity ?? null);
  const [meals, setMeals] = useState<3 | 4 | 5 | null>(initial?.mealsPerDay ?? null);

  const errs = bodyErrors(age, height, weight);
  const fieldErr = (k: keyof BodyErrors) => (showBodyErrors && errs[k] ? errs[k] : null);

  const steps: WizardStep[] = [
    {
      title: "What do you want from your food?",
      hint: "This sets your calorie target against what your body burns.",
      validate: () => (goal ? null : "Pick one goal."),
      render: () => (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {GOALS.map((o) => (
            <button key={o.v} className="choice" aria-pressed={goal === o.v} onClick={() => setGoal(o.v)}>
              <div className="choice-title">{o.title}</div>
              <div className="choice-sub">{o.sub}</div>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "How do you eat?",
      hint: "Every food in your meals follows this. Add anything you need left out.",
      validate: () => (diet ? null : "Pick your diet."),
      render: () => (
        <div className="grid gap-5">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {DIETS.map((o) => (
              <button key={o.v} className="choice" aria-pressed={diet === o.v} onClick={() => setDiet(o.v)}>
                <div className="choice-title">{o.title}</div>
                <div className="choice-sub">{o.sub}</div>
              </button>
            ))}
          </div>
          <div>
            <span className="field-label">Avoid (optional)</span>
            <div className="flex flex-wrap gap-2">
              {AVOID.map((o) => (
                <button
                  key={o.v}
                  className="chip"
                  aria-pressed={avoid.includes(o.v)}
                  onClick={() => setAvoid((cur) => (cur.includes(o.v) ? cur.filter((x) => x !== o.v) : [...cur, o.v]))}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Your body numbers",
      hint: "Age, height and weight give your resting energy use. Nothing leaves this device.",
      validate: () => {
        if (!sex) {
          setShowBodyErrors(true);
          return "Choose male or female. The formula differs.";
        }
        const e = bodyErrors(age, height, weight);
        if (e.age || e.height || e.weight) {
          setShowBodyErrors(true);
          return e.age ?? e.height ?? e.weight ?? null;
        }
        return null;
      },
      render: () => (
        <div className="grid gap-4">
          <div>
            <span className="field-label">Sex</span>
            <div className="flex gap-2">
              <button className="chip" aria-pressed={sex === "male"} onClick={() => setSex("male")}>Male</button>
              <button className="chip" aria-pressed={sex === "female"} onClick={() => setSex("female")}>Female</button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="nw-age">Age</label>
              <input id="nw-age" className="input" inputMode="numeric" placeholder="24" value={age} onChange={(e) => setAge(e.target.value)} aria-invalid={!!fieldErr("age")} />
              {fieldErr("age") && <p className="mt-1 text-[12px] font-semibold text-red">{fieldErr("age")}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="nw-height">Height (cm)</label>
              <input id="nw-height" className="input" inputMode="decimal" placeholder="170" value={height} onChange={(e) => setHeight(e.target.value)} aria-invalid={!!fieldErr("height")} />
              {fieldErr("height") && <p className="mt-1 text-[12px] font-semibold text-red">{fieldErr("height")}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="nw-weight">Weight (kg)</label>
              <input id="nw-weight" className="input" inputMode="decimal" placeholder="68" value={weight} onChange={(e) => setWeight(e.target.value)} aria-invalid={!!fieldErr("weight")} />
              {fieldErr("weight") && <p className="mt-1 text-[12px] font-semibold text-red">{fieldErr("weight")}</p>}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "How active is your day?",
      hint: "Outside the gym. Your workouts are counted separately.",
      validate: () => (activity ? null : "Pick the closest match."),
      render: () => (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {ACTIVITY.map((o) => (
            <button key={o.v} className="choice" aria-pressed={activity === o.v} onClick={() => setActivity(o.v)}>
              <div className="choice-title">{o.title}</div>
              <div className="choice-sub">{o.sub}</div>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "How many meals a day?",
      hint: "3 meals is breakfast, lunch and dinner. 4 adds an evening snack. 5 adds a mid-morning meal.",
      validate: () => (meals ? null : "Pick 3, 4 or 5 meals."),
      render: () => (
        <div className="flex flex-wrap gap-2">
          {MEALS.map((m) => (
            <button key={m} className="chip" aria-pressed={meals === m} onClick={() => setMeals(m)}>
              {m} meals
            </button>
          ))}
        </div>
      ),
    },
  ];

  function finish() {
    if (!goal || !diet || !sex || !activity || !meals) throw new Error("Some answers are missing.");
    const e = bodyErrors(age, height, weight);
    if (e.age || e.height || e.weight) throw new Error("Check your body numbers.");
    const plan = generateNutritionPlan({
      goal,
      diet,
      avoid,
      sex,
      age: Number(age),
      heightCm: Number(height),
      weightKg: Number(weight),
      activity,
      mealsPerDay: meals,
    });
    if (!plan || plan.meals.length === 0) throw new Error("The plan came back empty.");
    onDone(plan);
  }

  return (
    <Wizard
      title={forName ? `Nutrition for ${forName}` : "Your nutrition plan"}
      steps={steps}
      finishLabel="Build my plan"
      onFinish={finish}
      onClose={onClose}
    />
  );
}
