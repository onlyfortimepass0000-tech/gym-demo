import type { NutritionAnswers, NutritionPlan, Meal } from "./types";

export function buildNutritionPlan(a: NutritionAnswers): NutritionPlan {
  const w = parseFloat(a.weight) || 68;
  const goalMap: Record<string, number> = {
    "Lose fat": -300,
    "Build muscle": 300,
    Maintain: 0,
    "Get stronger": 200,
  };
  const actMap: Record<string, number> = {
    "Mostly sitting": 28,
    "Light walking": 32,
    "On my feet all day": 36,
    "Very active": 40,
  };
  const base = w * (actMap[a.activity] ?? 32);
  const kcal = Math.round((base + (goalMap[a.goal] ?? 0)) / 10) * 10;
  const pMult =
    a.goal === "Build muscle" || a.goal === "Get stronger"
      ? 2.0
      : a.goal === "Lose fat"
      ? 2.2
      : 1.6;
  const p = Math.round(w * pMult);
  const f = Math.round((kcal * 0.25) / 9);
  const c = Math.max(50, Math.round((kcal - p * 4 - f * 9) / 4));
  const veg = a.diet === "Vegetarian" || a.diet === "Vegan" || a.diet === "Jain";

  return {
    title: `${a.goal} · ${a.diet}`,
    kcal,
    macros: { p, c, f },
    meals: mealPlan(a, kcal, veg),
  };
}

function mealPlan(a: NutritionAnswers, kcal: number, veg: boolean): Meal[] {
  const breakdown: Record<string, number[]> = {
    "3 meals": [0.3, 0.4, 0.3],
    "4 meals": [0.25, 0.1, 0.35, 0.3],
    "5 meals": [0.22, 0.1, 0.28, 0.1, 0.3],
    "6 meals": [0.2, 0.1, 0.22, 0.08, 0.25, 0.15],
  };
  const dist = breakdown[a.meals] ?? breakdown["3 meals"];
  const names = ["Breakfast", "Mid-morning", "Lunch", "Evening snack", "Dinner", "Before bed"].slice(0, dist.length);
  const vegOptions = [
    "Oats with milk, banana, peanut butter, almonds.",
    "Greek yogurt with honey and seeds.",
    "Dal, roti, mixed sabzi, cucumber salad, curd.",
    "Fruit + handful of roasted chana.",
    "Paneer bhurji, 2 rotis, salad, bowl of dal.",
    "Warm milk with turmeric, 4 almonds.",
  ];
  const nonVegOptions = [
    "4-egg omelette, 2 slices whole-wheat toast, fruit.",
    "Whey shake with milk and a banana.",
    "Grilled chicken, brown rice, salad, curd.",
    "Boiled eggs + roasted peanuts.",
    "Fish curry, 2 rotis, sabzi, salad.",
    "Cottage cheese or casein shake.",
  ];
  const pool = veg ? vegOptions : nonVegOptions;
  return names.map((n, i) => ({
    name: n,
    kcal: Math.round((kcal * dist[i]) / 10) * 10,
    items: pool[i] ?? "Balanced plate: protein + complex carbs + vegetables.",
  }));
}

export const NUTRITION_QUESTIONS = [
  { k: "goal", q: "What's your main goal?", type: "chips", options: ["Lose fat", "Build muscle", "Maintain", "Get stronger"] },
  { k: "diet", q: "Any dietary preference?", type: "chips", options: ["Vegetarian", "Eggetarian", "Non-veg", "Vegan", "Jain"] },
  { k: "weight", q: "Your current weight?", type: "input", unit: "kg", placeholder: "68" },
  { k: "activity", q: "How active are you outside the gym?", type: "chips", options: ["Mostly sitting", "Light walking", "On my feet all day", "Very active"] },
  { k: "meals", q: "How many meals do you prefer per day?", type: "chips", options: ["3 meals", "4 meals", "5 meals", "6 meals"] },
] as const;
