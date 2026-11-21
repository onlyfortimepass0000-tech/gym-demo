export type Macros = { p: number; c: number; f: number };
export type Meal = { name: string; kcal: number; items: string };
export type NutritionAnswers = {
  goal: string;
  diet: string;
  weight: string;
  activity: string;
  meals: string;
};
export type NutritionPlan = {
  title: string;
  kcal: number;
  macros: Macros;
  meals: Meal[];
};
export type NutritionRecord = NutritionAnswers & { plan: NutritionPlan };

export type Exercise = { name: string; sets: number; reps: string; rest: string };
export type DayPlan = { name: string; time: number; tip: string; exercises: Exercise[] };
export type BeginnerAnswers = {
  experience: string;
  days: string;
  focus: string;
  limits: string;
  equipment: string;
};
export type BeginnerPlan = { title: string; note: string; days: DayPlan[] };
export type BeginnerRecord = BeginnerAnswers & { plan: BeginnerPlan };

export type AttendanceCell = { date: string; intensity: 0 | 1 | 2 | 3 };
export type AttendanceData = {
  history: AttendanceCell[];
  streak: number;
  weekly: number;
  totalLast8Weeks: number;
  checkedInToday: boolean;
  openSessionId: number | null;
  checkInTime: number | null;
};

export type Client = {
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
