import { EXERCISE_LIBRARY, SETUP_EQUIPMENT, generateTrainingPlan } from "../lib/workout-engine";
import type { Experience, Goal, Limitation, Setup, TrainingIntake, TrainingPlan } from "../lib/types";

const EXPS: Experience[] = ["never", "some", "returning", "intermediate"];
const DAYS: TrainingIntake["daysPerWeek"][] = [2, 3, 4, 5];
const MINS: TrainingIntake["minutesPerSession"][] = [30, 45, 60, 75];
const GOALS: Goal[] = ["fat-loss", "muscle", "strength", "general"];
const SETUPS: Setup[] = ["full-gym", "dumbbells", "home-bodyweight", "home-bands"];
const LIMS: Limitation[][] = [[], ["knee"], ["lower-back"], ["shoulder"], ["wrist"], ["knee", "lower-back"], ["shoulder", "wrist"]];

const byId = new Map(EXERCISE_LIBRARY.map((e) => [e.id, e]));
const failures: Record<string, string[]> = {};
const checks: Record<string, number> = {};

function check(name: string, ok: boolean, detail: () => string) {
  checks[name] = (checks[name] ?? 0) + 1;
  if (!ok) (failures[name] ??= []).push(detail());
}

const tag = (i: TrainingIntake) => `${i.experience}/${i.daysPerWeek}d/${i.minutesPerSession}m/${i.goal}/${i.setup}/[${i.limitations.join("+")}]`;
const strip = (p: TrainingPlan) => JSON.stringify({ ...p, createdAt: 0 });

type Stat = { n: number; sum: number; min: number; max: number; out12: number; out15: number };
const stats: Record<number, Stat> = {};
let total = 0;

for (const experience of EXPS)
  for (const daysPerWeek of DAYS)
    for (const minutesPerSession of MINS)
      for (const goal of GOALS)
        for (const setup of SETUPS)
          for (const limitations of LIMS) {
            const intake: TrainingIntake = { experience, daysPerWeek, minutesPerSession, goal, setup, limitations };
            const plan = generateTrainingPlan(intake);
            total++;
            const t = tag(intake);
            const beginner = experience !== "intermediate";

            check("sessions-count", plan.sessions.length === daysPerWeek, () => t);
            check("weekdays-unique-sorted", new Set(plan.weekdays).size === daysPerWeek && plan.weekdays.every((d, i) => i === 0 || d > plan.weekdays[i - 1]) && plan.sessions.every((s, i) => s.weekday === plan.weekdays[i]), () => `${t} ${plan.weekdays}`);
            check("plan-text", plan.title.includes(`${daysPerWeek}-day`) && plan.title.includes(`${minutesPerSession}`) && plan.summary.includes(`${minutesPerSession} minutes`), () => t);
            check("progression-4", plan.progression.length === 4, () => t);
            check("rules-4-6", plan.rules.length >= 4 && plan.rules.length <= 6, () => `${t} ${plan.rules.length}`);

            for (const s of plan.sessions) {
              const ids = s.exercises.map((e) => e.id);
              check("min-exercises", ids.length >= (minutesPerSession === 30 ? 3 : 4), () => `${t} ${s.name} has ${ids.length}`);
              check("no-repeat-in-session", new Set(ids).size === ids.length, () => `${t} ${s.name}`);
              check("warmup-3-5", s.warmup.length >= 3 && s.warmup.length <= 5, () => `${t} ${s.name} ${s.warmup.length}`);

              const dev = (s.estMinutes - minutesPerSession) / minutesPerSession;
              const st = (stats[minutesPerSession] ??= { n: 0, sum: 0, min: 1e9, max: 0, out12: 0, out15: 0 });
              st.n++;
              st.sum += s.estMinutes;
              st.min = Math.min(st.min, s.estMinutes);
              st.max = Math.max(st.max, s.estMinutes);
              if (Math.abs(dev) > 0.12) st.out12++;
              if (Math.abs(dev) > 0.15) st.out15++;
              check("est-within-15pct", Math.abs(dev) <= 0.15, () => `${t} ${s.name} est ${s.estMinutes} vs ${minutesPerSession}`);

              for (const e of s.exercises) {
                const lib = byId.get(e.id);
                check("exercise-in-library", !!lib, () => `${t} ${e.id}`);
                if (!lib) continue;
                check("no-contraindicated", !lib.contraindications.some((c) => limitations.includes(c)), () => `${t} ${e.id}`);
                check("equipment-ok", lib.equip.some((q) => SETUP_EQUIPMENT[setup].includes(q)), () => `${t} ${e.id}`);
                if (beginner) check("beginner-no-d3", lib.difficulty < 3, () => `${t} ${e.id}`);
                if (experience === "never") check("never-d1", lib.difficulty === 1, () => `${t} ${e.id}`);
                check("sets-rest-sane", e.sets >= 2 && e.sets <= 5 && e.restSec >= 30 && e.restSec <= 180 && e.rpe >= 5 && e.rpe <= 9, () => `${t} ${e.id} ${e.sets}x ${e.restSec}s rpe${e.rpe}`);
              }
            }
          }

// determinism
{
  const i: TrainingIntake = { experience: "some", daysPerWeek: 4, minutesPerSession: 45, goal: "muscle", setup: "dumbbells", limitations: ["knee"] };
  check("deterministic", strip(generateTrainingPlan(i)) === strip(generateTrainingPlan(i)), () => "plans differ between runs");
}

// (g) goal changes prescription; limitations change exercise choice
for (const experience of EXPS)
  for (const daysPerWeek of DAYS)
    for (const setup of SETUPS) {
      const sig = (g: Goal) => {
        const p = generateTrainingPlan({ experience, daysPerWeek, minutesPerSession: 60, goal: g, setup, limitations: [] });
        return p.sessions.map((s) => s.exercises.map((e) => `${e.sets}x${e.reps}@${e.restSec}`).join("|")).join("/");
      };
      const sigs = GOALS.map(sig);
      check("goal-changes-prescription", new Set(sigs).size === GOALS.length, () => `${experience}/${daysPerWeek}d/${setup}`);
    }

for (const daysPerWeek of DAYS)
  for (const goal of GOALS)
    for (const lim of ["knee", "lower-back", "shoulder", "wrist"] as Limitation[]) {
      const ids = (limitations: Limitation[]) =>
        generateTrainingPlan({ experience: "intermediate", daysPerWeek, minutesPerSession: 60, goal, setup: "full-gym", limitations })
          .sessions.map((s) => s.exercises.map((e) => e.id).join(","))
          .join("/");
      check("limitation-changes-exercises", ids([]) !== ids([lim]), () => `${daysPerWeek}d/${goal}/${lim}`);
    }

// experience changes output
for (const goal of GOALS) {
  const a = generateTrainingPlan({ experience: "never", daysPerWeek: 3, minutesPerSession: 45, goal, setup: "full-gym", limitations: [] });
  const b = generateTrainingPlan({ experience: "intermediate", daysPerWeek: 3, minutesPerSession: 45, goal, setup: "full-gym", limitations: [] });
  check("experience-changes-plan", JSON.stringify(a.sessions.map((s) => s.exercises)) !== JSON.stringify(b.sessions.map((s) => s.exercises)), () => goal);
}

// ───────── report ─────────
const fmtPlan = (p: TrainingPlan) => {
  const out: string[] = [`\n=== ${p.title} ===`, p.summary, ""];
  for (const s of p.sessions) {
    out.push(`${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][s.weekday]} · ${s.name} (~${s.estMinutes} min) — ${s.focus}`);
    out.push(`  Warm-up: ${s.warmup.join(" | ")}`);
    for (const e of s.exercises) out.push(`  - ${e.name}: ${e.sets} × ${e.reps}, rest ${e.restSec}s, RPE ${e.rpe}${e.tempo ? `, tempo ${e.tempo}` : ""}${e.note ? `  [${e.note}]` : ""}`);
    if (s.finisher) out.push(`  Finisher: ${s.finisher.name} — ${s.finisher.detail}`);
    out.push("");
  }
  out.push("Progression:", ...p.progression.map((w) => `  Wk${w.week} ${w.title}: ${w.instruction}`));
  out.push("Rules:", ...p.rules.map((r) => `  • ${r}`));
  return out.join("\n");
};

console.log(fmtPlan(generateTrainingPlan({ experience: "never", daysPerWeek: 3, minutesPerSession: 45, goal: "fat-loss", setup: "home-bodyweight", limitations: ["knee"] })));
console.log(fmtPlan(generateTrainingPlan({ experience: "intermediate", daysPerWeek: 4, minutesPerSession: 60, goal: "muscle", setup: "full-gym", limitations: [] })));

console.log(`\nPlans generated: ${total}  (library: ${EXERCISE_LIBRARY.length} exercises)`);
console.log("\nTime-fit by session length");
console.log("min | sessions | mean | min | max | >12% | >15%");
for (const m of MINS) {
  const s = stats[m];
  console.log(`${String(m).padStart(3)} | ${String(s.n).padStart(8)} | ${(s.sum / s.n).toFixed(1).padStart(4)} | ${String(s.min).padStart(3)} | ${String(s.max).padStart(3)} | ${String(s.out12).padStart(4)} | ${String(s.out15).padStart(4)}`);
}

console.log("\nAssertions");
let failed = 0;
for (const [name, n] of Object.entries(checks)) {
  const f = failures[name]?.length ?? 0;
  failed += f;
  console.log(`${f === 0 ? "PASS" : "FAIL"}  ${name.padEnd(30)} ${n} checks${f ? `, ${f} failed` : ""}`);
  if (f) for (const d of failures[name].slice(0, 5)) console.log(`        ${d}`);
}
if (failed) {
  console.error(`\n${failed} failures`);
  process.exit(1);
}
console.log("\nAll assertions passed.");
