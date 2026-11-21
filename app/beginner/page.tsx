import BeginnerIntakeButton from "@/components/BeginnerIntakeButton";
import WorkoutTable from "@/components/WorkoutTable";
import { CURRENT_MEMBER_ID, getDb } from "@/lib/db";
import type { BeginnerRecord } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

function loadBeginner(): BeginnerRecord | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT experience, days, focus, limits, equipment, plan FROM beginner_plans WHERE member_id = ?"
    )
    .get(CURRENT_MEMBER_ID) as
    | { experience: string; days: number; focus: string; limits: string; equipment: string; plan: string }
    | undefined;
  if (!row) return null;
  return {
    experience: row.experience,
    days: `${row.days} days`,
    focus: row.focus,
    limits: row.limits,
    equipment: row.equipment,
    plan: JSON.parse(row.plan),
  };
}

export default function BeginnerPage() {
  const b = loadBeginner();

  if (!b) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="lg:col-span-12">
          <div
            className="card"
            style={{
              padding: "28px",
              background:
                "radial-gradient(circle at 80% 0%, rgba(212,255,61,0.15), transparent 50%), var(--surface)",
            }}
          >
            <div className="eyebrow">New to lifting</div>
            <h1 className="mt-2 max-w-[720px] font-display text-[clamp(42px,7vw,68px)] font-semibold leading-[0.95] tracking-tight">
              Your first 4 weeks,
              <br />
              planned around you.
            </h1>
            <p className="muted mt-3.5 max-w-[560px] text-base">
              Answer 5 quick questions. We&apos;ll build a safe, progressive plan — exact sets, reps, and rest — so
              you don&apos;t waste a session guessing.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <BeginnerIntakeButton label="Build my plan" primary large />
              <Link href="/member" className="btn btn-lg">
                I&apos;m not a beginner
              </Link>
            </div>
          </div>
        </section>

        <StepCard n="01" title="Tell us about you" body="Experience, days you can train, what you want to work on, injuries, what gear you can use." />
        <StepCard n="02" title="Get your week" body="A real schedule with specific exercises, written in plain language. No mystery jargon." />
        <StepCard n="03" title="Progress with a trainer" body="Your plan lands in a trainer's dashboard. They see what you did and nudge where needed." />
      </div>
    );
  }

  const cols = b.plan.days.length === 3 ? "lg:col-span-4" : "lg:col-span-6";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <section className="lg:col-span-12">
        <div className="card" style={{ padding: "28px" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="eyebrow">Your beginner plan · week 1</div>
              <h1 className="mt-1 font-display text-[clamp(26px,3.5vw,34px)] font-semibold tracking-tight">
                {b.plan.title}
              </h1>
              <p className="muted mt-1.5 max-w-[560px]">{b.plan.note}</p>
            </div>
            <BeginnerIntakeButton label="Redo intake" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="pill pill-accent">{b.days} / week</div>
            <div className="pill">{b.focus}</div>
            <div className="pill">{b.equipment}</div>
            {b.limits && b.limits !== "None" && (
              <div className="pill pill-warn">Mindful of: {b.limits}</div>
            )}
          </div>
        </div>
      </section>

      {b.plan.days.map((d, i) => (
        <section key={i} className={cols}>
          <div className="card h-full">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="eyebrow">Day {i + 1}</div>
                <h3 className="mt-1 font-display text-lg font-semibold">{d.name}</h3>
              </div>
              <div className="pill">
                <span className="dot" /> {d.time} min
              </div>
            </div>
            <WorkoutTable items={d.exercises} />
            <div className="divider" />
            <div className="flex items-start gap-1.5">
              <span className="k">Tip:</span>
              <span className="text-[13px]">{d.tip}</span>
            </div>
          </div>
        </section>
      ))}

      <section className="lg:col-span-12">
        <div className="card-flat">
          <div className="eyebrow">Progression</div>
          <h3 className="mt-1 font-display text-lg font-semibold">How this gets harder</h3>
          <p className="muted mt-1.5">
            Week 1: nail form, finish every set. Week 2: add one rep per set. Week 3: add a set to your main lift.
            Week 4: deload to 60% and test a new PR.
          </p>
        </div>
      </section>
    </div>
  );
}

function StepCard({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <section className="lg:col-span-4">
      <div className="card">
        <div className="eyebrow">Step {n}</div>
        <h3 className="mt-1.5 font-display text-lg font-semibold">{title}</h3>
        <p className="muted mt-2 text-sm">{body}</p>
      </div>
    </section>
  );
}
