// ---------- Training ----------
export type Goal = "fat-loss" | "muscle" | "strength" | "general";
export type Limitation = "knee" | "lower-back" | "shoulder" | "wrist";
export type Setup = "full-gym" | "dumbbells" | "home-bodyweight" | "home-bands";
export type Experience = "never" | "some" | "returning" | "intermediate";

export type TrainingIntake = {
  experience: Experience;
  daysPerWeek: 2 | 3 | 4 | 5;
  minutesPerSession: 30 | 45 | 60 | 75;
  goal: Goal;
  limitations: Limitation[];
  setup: Setup;
};

export type PlannedExercise = {
  id: string;
  name: string;
  sets: number;
  reps: string; // "8–10", "30–40 s"
  restSec: number;
  rpe: number; // target effort 1–10
  tempo?: string; // "3-1-1"
  cue: string; // one coaching cue
  note?: string; // why this variant was chosen (injury / equipment swap)
};

export type PlannedSession = {
  id: string; // "s1".."s5"
  name: string; // "Full body A", "Upper", "Push"
  focus: string; // one-line description
  weekday: number; // 0=Sun … 6=Sat
  warmup: string[];
  exercises: PlannedExercise[];
  finisher?: { name: string; detail: string };
  estMinutes: number;
};

export type TrainingPlan = {
  title: string;
  summary: string;
  intake: TrainingIntake;
  weekdays: number[]; // sorted training weekdays
  sessions: PlannedSession[]; // one per training day, in weekly order
  progression: { week: number; title: string; instruction: string }[];
  rules: string[]; // plain-language rules ("stop a set if pain is sharp")
  createdAt: number;
};

// ---------- Nutrition ----------
export type NutritionGoal = "fat-loss" | "muscle" | "maintain" | "recomp";
export type Diet = "veg" | "jain" | "vegan" | "egg" | "nonveg";
export type Avoid = "dairy" | "nuts" | "soy" | "gluten";
export type Activity = "sedentary" | "light" | "moderate" | "high";

export type NutritionIntake = {
  goal: NutritionGoal;
  diet: Diet;
  avoid: Avoid[];
  sex: "male" | "female";
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  mealsPerDay: 3 | 4 | 5;
};

export type FoodItem = {
  name: string;
  qty: string; // "120 g", "2 rotis", "1 cup"
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type PlannedMeal = {
  slot: string; // "Breakfast"
  time: string; // "8:00 am"
  items: FoodItem[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type NutritionPlan = {
  title: string;
  intake: NutritionIntake;
  bmr: number;
  tdee: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterL: number;
  meals: PlannedMeal[];
  notes: string[];
  createdAt: number;
};
