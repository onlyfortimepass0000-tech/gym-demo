import type { Diet, Experience, Goal, Limitation, NutritionGoal, NutritionIntake, TrainingIntake } from "./types";
import { DAY, HOUR, addDays, dayKey, startOfDay } from "./dates";
import { rnd, pick } from "./prng";

export type PlanTier = "Monthly" | "Quarterly" | "Annual";

export type Trainer = { id: string; name: string; short: string };
export const TRAINERS: Trainer[] = [
  { id: "vikrant", name: "Coach Vikrant Shah", short: "Vikrant" },
  { id: "meera", name: "Coach Meera Kulkarni", short: "Meera" },
  { id: "devansh", name: "Coach Devansh Thakur", short: "Devansh" },
  { id: "anita", name: "Coach Anita Rao", short: "Anita" },
];
export const DEMO_TRAINER_ID = "vikrant";

export type Member = {
  id: string;
  name: string;
  sex: "male" | "female";
  age: number;
  heightCm: number;
  weightKg: number;
  tier: PlanTier;
  joinedDaysAgo: number;
  renewsInDays: number;
  trainerId: string;
  goal: Goal;
  experience: Experience;
  daysPerWeek: 2 | 3 | 4 | 5;
  limitations: Limitation[];
  attendance: number; // 0..1 chance of showing on a planned day
  hour: number; // usual check-in hour
  lapsedDays: number; // no visits in this many most-recent days
  persona: boolean; // driven by real clicks in the demo
  blank: boolean; // starts with no plan and no history
  seedNutrition: boolean;
  diet: Diet;
};

// Must match the weekday logic inside the workout engine.
export const WEEKDAYS_BY_DAYS: Record<number, number[]> = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 5, 6],
};

export type Session = {
  id: string;
  memberId: string;
  checkIn: number;
  checkOut: number | null;
  source: "seed" | "app";
};

const ROSTER: [string, "male" | "female"][] = [
  ["Rohan Kapoor", "male"], ["Priya Nair", "female"], ["Arjun Menon", "male"], ["Sneha Joshi", "female"],
  ["Vihaan Gupta", "male"], ["Ishita Verma", "female"], ["Aditya Rane", "male"], ["Neha Bhatt", "female"],
  ["Kabir Malhotra", "male"], ["Tanvi Iyer", "female"], ["Siddharth Pawar", "male"], ["Pooja Sawant", "female"],
  ["Yash Chauhan", "male"], ["Mitali Shah", "female"], ["Dhruv Agarwal", "male"], ["Aarohi Kulkarni", "female"],
  ["Nikhil Deshmukh", "male"], ["Simran Kaur", "female"], ["Harsh Vora", "male"], ["Kavya Reddy", "female"],
  ["Om Patil", "male"], ["Radhika Sethi", "female"], ["Tejas Bhosale", "male"], ["Anjali Mishra", "female"],
  ["Parth Doshi", "male"], ["Diya Chopra", "female"], ["Manav Jain", "male"], ["Shreya Pillai", "female"],
  ["Ayaan Khan", "male"], ["Meghna Das", "female"], ["Rahul Naik", "male"], ["Zoya Ansari", "female"],
  ["Varun Saxena", "male"], ["Kritika Bose", "female"], ["Jay Mehra", "male"], ["Ritika Singhania", "female"],
  ["Samar Gokhale", "male"], ["Nidhi Trivedi", "female"], ["Atharv Kamat", "male"], ["Bhavna Solanki", "female"],
  ["Devang Parikh", "male"], ["Esha Wagle", "female"], ["Chirag Lokhande", "male"], ["Ria Fernandes", "female"],
];

const EXPERIENCES: Experience[] = ["never", "some", "some", "returning", "intermediate", "intermediate", "intermediate"];
const GOALS: Goal[] = ["fat-loss", "muscle", "muscle", "strength", "general", "fat-loss"];
const LIMITS: Limitation[] = ["knee", "lower-back", "shoulder"];
const DIETS: Diet[] = ["veg", "veg", "veg", "veg", "egg", "nonveg", "nonveg", "nonveg", "jain", "vegan"];
const TIERS: PlanTier[] = ["Monthly", "Monthly", "Monthly", "Quarterly", "Quarterly", "Annual"];
const DAYS_OPTIONS: (2 | 3 | 4 | 5)[] = [3, 3, 4, 4, 4, 5, 2];
const HOURS = [6, 7, 7, 8, 12, 13, 17, 18, 18, 19, 19, 20];
const CYCLE_DAYS: Record<PlanTier, number> = { Monthly: 30, Quarterly: 90, Annual: 365 };

function buildRoster(): Member[] {
  const members: Member[] = [];

  members.push({
    id: "karan", name: "Karan Mehta", sex: "male", age: 24, heightCm: 176, weightKg: 72,
    tier: "Monthly", joinedDaysAgo: 150, renewsInDays: 12, trainerId: "vikrant",
    goal: "muscle", experience: "intermediate", daysPerWeek: 4, limitations: [],
    attendance: 0.86, hour: 18, lapsedDays: 0, persona: true, blank: false, seedNutrition: false, diet: "veg",
  });
  members.push({
    id: "riya", name: "Riya Patel", sex: "female", age: 21, heightCm: 163, weightKg: 56,
    tier: "Monthly", joinedDaysAgo: 0, renewsInDays: 30, trainerId: "vikrant",
    goal: "general", experience: "never", daysPerWeek: 3, limitations: [],
    attendance: 0, hour: 18, lapsedDays: 0, persona: true, blank: true, seedNutrition: false, diet: "veg",
  });

  ROSTER.forEach(([name, sex], i) => {
    const id = `m${String(i + 1).padStart(2, "0")}`;
    const r = (k: string) => rnd(`${id}:${k}`);
    const tier = pick(`${id}:tier`, TIERS);
    let lapsed = 0;
    if (i % 7 === 3) lapsed = 11 + Math.floor(r("lapse") * 14);
    else if (i % 9 === 5) lapsed = 4 + Math.floor(r("lapse") * 5);
    const experience = pick(`${id}:exp`, EXPERIENCES);
    const limit = r("limit") < 0.15 ? [pick(`${id}:lim`, LIMITS)] : [];
    members.push({
      id, name, sex,
      age: 19 + Math.floor(r("age") * 29),
      heightCm: Math.round((sex === "male" ? 165 : 153) + r("h") * 20),
      weightKg: Math.round((sex === "male" ? 62 : 50) + r("w") * 28),
      tier,
      joinedDaysAgo: i < 3 ? 6 + i * 4 : 25 + Math.floor(r("join") * 380),
      renewsInDays: 1 + Math.floor(r("renew") * CYCLE_DAYS[tier]),
      trainerId: TRAINERS[i % 4].id,
      goal: pick(`${id}:goal`, GOALS),
      experience,
      daysPerWeek: pick(`${id}:days`, DAYS_OPTIONS),
      limitations: limit,
      attendance: 0.4 + r("att") * 0.5,
      hour: pick(`${id}:hour`, HOURS),
      lapsedDays: lapsed,
      persona: false, blank: false, seedNutrition: r("nut") < 0.6,
      diet: pick(`${id}:diet`, DIETS),
    });
  });
  return members;
}

export const SEED_MEMBERS: Member[] = buildRoster();

export type Signup = { id: string; name: string; sex: "male" | "female"; tier: PlanTier; daysAgo: number };
export const SEED_SIGNUPS: Signup[] = [
  { id: "su1", name: "Ananya Desai", sex: "female", tier: "Quarterly", daysAgo: 0 },
  { id: "su2", name: "Rishi Nambiar", sex: "male", tier: "Monthly", daysAgo: 1 },
  { id: "su3", name: "Falguni Mistry", sex: "female", tier: "Annual", daysAgo: 2 },
];

export function trainingIntakeFor(m: Member): TrainingIntake {
  return {
    experience: m.experience,
    daysPerWeek: m.daysPerWeek,
    minutesPerSession: m.experience === "never" ? 45 : 60,
    goal: m.goal,
    limitations: m.limitations,
    setup: "full-gym",
  };
}

const NUTRITION_GOAL: Record<Goal, NutritionGoal> = {
  "fat-loss": "fat-loss", muscle: "muscle", strength: "recomp", general: "maintain",
};

export function nutritionIntakeFor(m: Member): NutritionIntake {
  return {
    goal: NUTRITION_GOAL[m.goal],
    diet: m.diet,
    avoid: [],
    sex: m.sex,
    age: m.age,
    heightCm: m.heightCm,
    weightKg: m.weightKg,
    activity: "moderate",
    mealsPerDay: 4,
  };
}

// ---------- generated attendance ----------
// Seeded members' visits are a pure function of (member, date), so the roster
// always looks alive relative to the real clock without storing anything.

const pastCache = new Map<string, Session[]>();

function sessionFor(m: Member, dayTs: number, plannedWeekdays: number[]): Session | null {
  const key = dayKey(dayTs);
  const weekday = new Date(dayTs).getDay();
  const planned = plannedWeekdays.includes(weekday);
  const chance = planned ? m.attendance : 0.05;
  if (rnd(`${m.id}:${key}:go`) >= chance) return null;
  const hourJitter = (rnd(`${m.id}:${key}:h`) - 0.5) * 2;
  const minute = Math.floor(rnd(`${m.id}:${key}:min`) * 60);
  const start = dayTs + Math.round(m.hour * HOUR + hourJitter * HOUR + minute * 60000) % DAY;
  const duration = (42 + Math.floor(rnd(`${m.id}:${key}:dur`) * 45)) * 60000;
  return { id: `${m.id}-${key}`, memberId: m.id, checkIn: start, checkOut: start + duration, source: "seed" };
}

export function generatedSessions(m: Member, now: number): Session[] {
  if (m.blank) return [];
  const today = startOfDay(now);
  const planned = WEEKDAYS_BY_DAYS[m.daysPerWeek];
  const cacheKey = `${m.id}|${dayKey(today)}`;
  let past = pastCache.get(cacheKey);
  if (!past) {
    past = [];
    const from = addDays(today, -Math.min(m.joinedDaysAgo, 180));
    for (let d = from; d < today; d = addDays(d, 1)) {
      const age = Math.round((today - d) / DAY);
      if (age <= m.lapsedDays) continue;
      const s = sessionFor(m, d, planned);
      if (s) past.push(s);
    }
    pastCache.set(cacheKey, past);
  }
  const out = past.slice();
  if (!m.persona && m.lapsedDays === 0) {
    const s = sessionFor(m, today, planned);
    if (s && s.checkIn <= now) {
      out.push({ ...s, checkOut: s.checkOut! <= now ? s.checkOut : null });
    }
  }
  return out;
}
