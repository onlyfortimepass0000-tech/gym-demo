"use client";
import { useState } from "react";
import type { Experience, Goal, Limitation, Setup, TrainingIntake, TrainingPlan } from "@/lib/types";
import { generateTrainingPlan } from "@/lib/workout-engine";
import Wizard, { type WizardStep } from "./Wizard";

const EXPERIENCE: { v: Experience; title: string; sub: string }[] = [
  { v: "never", title: "Never lifted", sub: "Starting from zero. We teach the movements first and keep every set easy." },
  { v: "some", title: "Tried a few times", sub: "You know a few exercises but have no steady routine." },
  { v: "returning", title: "Returning after a break", sub: "You trained before and want to ease back in." },
  { v: "intermediate", title: "Train regularly", sub: "Six months or more of consistent lifting." },
];

const GOALS: { v: Goal; title: string; sub: string }[] = [
  { v: "fat-loss", title: "Lose fat", sub: "More sets, shorter rests and a conditioning finisher." },
  { v: "muscle", title: "Build muscle", sub: "Moderate loads, 8 to 12 reps, enough volume to grow." },
  { v: "strength", title: "Get stronger", sub: "Heavier sets of 3 to 6 reps with long rests." },
  { v: "general", title: "General fitness", sub: "Balanced sessions, easy cardio and steady energy." },
];

const SETUPS: { v: Setup; title: string; sub: string }[] = [
  { v: "full-gym", title: "Full gym", sub: "Barbells, machines, cables and dumbbells." },
  { v: "dumbbells", title: "Dumbbells only", sub: "Dumbbells, kettlebells and bodyweight." },
  { v: "home-bodyweight", title: "Home, bodyweight", sub: "No equipment at all." },
  { v: "home-bands", title: "Home with bands", sub: "Resistance bands and bodyweight." },
];

const LIMITS: { v: Limitation; label: string }[] = [
  { v: "knee", label: "Knee" },
  { v: "lower-back", label: "Lower back" },
  { v: "shoulder", label: "Shoulder" },
  { v: "wrist", label: "Wrist" },
];

const DAYS = [2, 3, 4, 5] as const;
const MINUTES = [30, 45, 60, 75] as const;

function weeklyTime(days: number, mins: number) {
  const total = days * mins;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h > 0 ? `${h} h` : ""}${h > 0 && m > 0 ? " " : ""}${m > 0 ? `${m} m` : ""}`;
}

export default function TrainingWizard({
  initial,
  forName,
  onDone,
  onClose,
}: {
  initial?: Partial<TrainingIntake>;
  forName?: string;
  onDone: (plan: TrainingPlan) => void;
  onClose: () => void;
}) {
  const [exp, setExp] = useState<Experience | null>(initial?.experience ?? null);
  const [days, setDays] = useState<2 | 3 | 4 | 5 | null>(initial?.daysPerWeek ?? null);
  const [mins, setMins] = useState<30 | 45 | 60 | 75 | null>(initial?.minutesPerSession ?? null);
  const [goal, setGoal] = useState<Goal | null>(initial?.goal ?? null);
  const [limits, setLimits] = useState<Limitation[]>(initial?.limitations ?? []);
  // [] alone can mean "None" or "not answered", so track the answer explicitly.
  const [limitsAnswered, setLimitsAnswered] = useState<boolean>(initial?.limitations !== undefined);
  const [setup, setSetup] = useState<Setup | null>(initial?.setup ?? null);

  function toggleLimit(v: Limitation) {
    setLimitsAnswered(true);
    setLimits((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  }

  const steps: WizardStep[] = [
    {
      title: "How much lifting have you done?",
      hint: "This sets how hard the exercises are and how many sets you start with.",
      validate: () => (exp ? null : "Pick the option that fits you best."),
      render: () => (
        <div className="grid gap-2.5">
          {EXPERIENCE.map((o) => (
            <button key={o.v} className="choice" aria-pressed={exp === o.v} onClick={() => setExp(o.v)}>
              <div className="choice-title">{o.title}</div>
              <div className="choice-sub">{o.sub}</div>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "How often, and for how long?",
      hint: "Pick the days you can keep up every week. Session length decides how many exercises fit.",
      validate: () => (!days ? "Choose how many days a week." : !mins ? "Choose how long each session can be." : null),
      render: () => (
        <div className="grid gap-5">
          <div>
            <span className="field-label">Days per week</span>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <button key={d} className="chip" aria-pressed={days === d} onClick={() => setDays(d)}>
                  {d} days
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="field-label">Minutes per session</span>
            <div className="flex flex-wrap gap-2">
              {MINUTES.map((m) => (
                <button key={m} className="chip" aria-pressed={mins === m} onClick={() => setMins(m)}>
                  {m} min
                </button>
              ))}
            </div>
          </div>
          {days && mins && (
            <p className="panel-flat px-3 py-2 text-[14px]">
              <span className="font-semibold">{days} days · {mins} min</span> = about {weeklyTime(days, mins)} a week
            </p>
          )}
        </div>
      ),
    },
    {
      title: "What is the main goal?",
      hint: "One goal drives the sets, reps and rest times. You can redo this later.",
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
      title: "Anything we should work around?",
      hint: "We swap exercises that load these joints and add a rule for each one you pick.",
      validate: () => (limitsAnswered ? null : "Pick the joints that bother you, or choose None."),
      render: () => (
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {LIMITS.map((o) => (
              <button key={o.v} className="chip" aria-pressed={limits.includes(o.v)} onClick={() => toggleLimit(o.v)}>
                {o.label}
              </button>
            ))}
            <button
              className="chip"
              aria-pressed={limitsAnswered && limits.length === 0}
              onClick={() => {
                setLimits([]);
                setLimitsAnswered(true);
              }}
            >
              None
            </button>
          </div>
          <p className="panel-flat px-3 py-2 text-[13px] text-ink-2">
            Example: with a knee limit, squats become box squats and hip thrusts, and jumping drops out of the plan.
          </p>
        </div>
      ),
    },
    {
      title: "What will you train with?",
      hint: "Every exercise in the plan uses only this equipment.",
      validate: () => (setup ? null : "Pick the equipment you will use."),
      render: () => (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {SETUPS.map((o) => (
            <button key={o.v} className="choice" aria-pressed={setup === o.v} onClick={() => setSetup(o.v)}>
              <div className="choice-title">{o.title}</div>
              <div className="choice-sub">{o.sub}</div>
            </button>
          ))}
        </div>
      ),
    },
  ];

  function finish() {
    if (!exp || !days || !mins || !goal || !setup) throw new Error("Some answers are missing.");
    const plan = generateTrainingPlan({
      experience: exp,
      daysPerWeek: days,
      minutesPerSession: mins,
      goal,
      limitations: limits,
      setup,
    });
    if (!plan || plan.sessions.length === 0) throw new Error("The plan came back empty.");
    onDone(plan);
  }

  return (
    <Wizard
      title={forName ? `Plan for ${forName}` : "Build your plan"}
      steps={steps}
      finishLabel="Build my plan"
      onFinish={finish}
      onClose={onClose}
    />
  );
}
