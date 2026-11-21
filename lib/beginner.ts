import type { BeginnerAnswers, BeginnerPlan, DayPlan, Exercise } from "./types";

export function buildBeginnerPlan(a: BeginnerAnswers): BeginnerPlan {
  const days = parseInt(a.days) || 3;
  const title = `${a.focus} · ${days}-day start`;
  const note =
    "A safe first block. Form before weight, finish every set with 1–2 reps in reserve, breathe through every rep. You'll feel the pattern by week 2.";

  const full = a.equipment === "Full gym";
  const dbOnly = a.equipment === "Dumbbells only";
  const home = a.equipment.startsWith("Home");

  const careKnee = a.limits === "Knee";
  const careBack = a.limits === "Lower back";
  const careSh = a.limits === "Shoulder";

  const fullBody: DayPlan = {
    name: "Full-body foundation",
    time: 45,
    tip: "Add 1 rep per set each session before adding weight.",
    exercises: [
      { name: careBack ? "Goblet squat (DB)" : full ? "Barbell back squat" : "Goblet squat (DB)", sets: 3, reps: "8–10", rest: "90s" },
      { name: home ? "Push-up (incline)" : "Dumbbell bench press", sets: 3, reps: "8–10", rest: "75s" },
      { name: full ? "Lat pulldown" : "One-arm DB row", sets: 3, reps: "10–12", rest: "60s" },
      { name: careSh ? "Side-lying DB raise" : "Seated DB shoulder press", sets: 3, reps: "10", rest: "60s" },
      { name: "Plank", sets: 3, reps: "30–45s", rest: "45s" },
    ],
  };

  const push: DayPlan = {
    name: "Push · upper",
    time: 50,
    tip: "Press straight up, not forward — elbows at 45°, not flared.",
    exercises: [
      { name: full ? "Barbell bench press" : "DB bench press", sets: 3, reps: "8–10", rest: "90s" },
      { name: careSh ? "Landmine press" : "Seated shoulder press", sets: 3, reps: "10", rest: "75s" },
      { name: "Incline DB press", sets: 3, reps: "10–12", rest: "60s" },
      { name: "Tricep rope pushdown", sets: 3, reps: "12", rest: "45s" },
      { name: "Cable lateral raise", sets: 3, reps: "12–15", rest: "45s" },
    ],
  };

  const pull: DayPlan = {
    name: "Pull · back + biceps",
    time: 50,
    tip: "Pull with your elbows, not your hands. Squeeze at the top for a second.",
    exercises: [
      { name: full ? "Lat pulldown" : "Assisted pull-up", sets: 3, reps: "8–10", rest: "90s" },
      { name: "One-arm DB row", sets: 3, reps: "10 each", rest: "60s" },
      { name: full ? "Seated cable row" : "DB bent row", sets: 3, reps: "10–12", rest: "60s" },
      { name: "Face pull", sets: 3, reps: "15", rest: "45s" },
      { name: "DB hammer curl", sets: 3, reps: "12", rest: "45s" },
    ],
  };

  const legs: DayPlan = {
    name: "Legs + core",
    time: 55,
    tip: careKnee
      ? "Stop just above parallel; strength first, depth later."
      : "Sit back into the heel. Knees track over toes, not inward.",
    exercises: [
      { name: careKnee ? "Leg press (high foot)" : full ? "Barbell back squat" : "Goblet squat", sets: 4, reps: "8", rest: "2m" },
      { name: careBack ? "Hip thrust" : "Romanian deadlift", sets: 3, reps: "10", rest: "90s" },
      { name: "Walking lunge", sets: 3, reps: "12 steps", rest: "60s" },
      { name: "Standing calf raise", sets: 3, reps: "15", rest: "45s" },
      { name: "Hanging knee raise", sets: 3, reps: "10–12", rest: "45s" },
    ],
  };

  const conditioning: DayPlan = {
    name: "Conditioning + core",
    time: 35,
    tip: "Short, hard, and consistent beats long and sloppy. Warm up thoroughly.",
    exercises: [
      { name: "Rowing machine", sets: 5, reps: "250m", rest: "60s" },
      { name: "KB swing", sets: 4, reps: "12", rest: "45s" },
      { name: "Dead bug", sets: 3, reps: "8 each", rest: "45s" },
      { name: "Farmer carry", sets: 3, reps: "30s", rest: "60s" },
    ],
  };

  const byCount: Record<number, DayPlan[]> = {
    2: [fullBody, fullBody],
    3: [fullBody, conditioning, fullBody],
    4: [push, pull, legs, conditioning],
    5: [push, pull, legs, fullBody, conditioning],
  };

  return { title, note, days: byCount[days] ?? byCount[3] };
}

export const BEGINNER_QUESTIONS = [
  { k: "experience", q: "Have you lifted weights before?", type: "chips", options: ["Never", "Tried a few times", "On and off", "Returning after a break"] },
  { k: "days", q: "How many days a week can you train?", type: "chips", options: ["2 days", "3 days", "4 days", "5 days"] },
  { k: "focus", q: "What matters most to you right now?", type: "chips", options: ["Lose fat", "Build muscle", "Get stronger", "Feel better / energy"] },
  { k: "limits", q: "Any injuries or things to be careful about?", type: "chips", options: ["None", "Lower back", "Knee", "Shoulder", "Wrist"] },
  { k: "equipment", q: "What will you train with?", type: "chips", options: ["Full gym", "Dumbbells only", "Home · bodyweight", "Home · bands + DBs"] },
] as const;
