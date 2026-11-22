"use client";
import Link from "next/link";
import { useState } from "react";
import { useCtx } from "@/lib/useCtx";
import {
  adherence, currentStreak, daysSinceLastVisit, memberById, nutritionOf, openSession, planOf, sessionsOf,
  weightSeries,
} from "@/lib/selectors";
import {
  DEMO_TRAINER_ID, TRAINERS, nutritionIntakeFor, trainingIntakeFor, type Member,
} from "@/lib/seed";
import { saveNutrition, savePlan } from "@/lib/store";
import { DAY, dayKey, fmtAgo, fmtDayShort, fmtDuration, fmtTime, startOfDay } from "@/lib/dates";
import { Empty, Initials, PageSkeleton, Panel, Stat, toast } from "./ui";
import Calendar from "./Calendar";
import MessageDialog from "./MessageDialog";
import PlanView from "./PlanView";
import NutritionView from "./NutritionView";
import TrainingWizard from "./TrainingWizard";
import NutritionWizard from "./NutritionWizard";
import ProgressView from "./ProgressView";

type Tab = "overview" | "calendar" | "plan" | "nutrition" | "progress";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "calendar", label: "Calendar" },
  { id: "plan", label: "Plan" },
  { id: "nutrition", label: "Nutrition" },
  { id: "progress", label: "Progress" },
];

const GOAL_LABEL: Record<Member["goal"], string> = {
  "fat-loss": "Fat loss",
  muscle: "Muscle gain",
  strength: "Strength",
  general: "General fitness",
};

function agoWords(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export default function ClientDetail({ id, from }: { id: string; from: "owner" | "trainer" }) {
  const ctx = useCtx();
  const [tab, setTab] = useState<Tab>("overview");
  const [wizard, setWizard] = useState<"training" | "nutrition" | null>(null);
  const [msgOpen, setMsgOpen] = useState(false);

  if (!ctx) return <PageSkeleton />;

  const backHref = from === "owner" ? "/owner" : "/trainer";
  const backLabel = from === "owner" ? "Back to owner dashboard" : "Back to clients";
  const back = (
    <div>
      <Link href={backHref} className="btn btn-sm btn-ghost">← {backLabel}</Link>
    </div>
  );

  const member = memberById(ctx, id);
  if (!member) {
    return (
      <div className="grid gap-4">
        {back}
        <Empty
          title="Client not found"
          body="This member does not exist or has not been assigned to a trainer yet."
          action={<Link href={backHref} className="btn btn-primary">{backLabel}</Link>}
        />
      </div>
    );
  }

  const demoTrainer = TRAINERS.find((t) => t.id === DEMO_TRAINER_ID)!;
  const sender =
    from === "owner"
      ? { name: "Gym owner", role: "owner" as const }
      : { name: demoTrainer.name, role: "trainer" as const };
  const coach = TRAINERS.find((t) => t.id === member.trainerId)?.name ?? "Unassigned";
  const first = member.name.split(" ")[0];

  const today = startOfDay(ctx.now);
  const sessions = sessionsOf(ctx, member);
  const a28 = adherence(ctx, member, sessions, 28);
  const a56 = adherence(ctx, member, sessions, 56);
  const prevPlanned = a56.planned - a28.planned;
  const prevPct = prevPlanned > 0 ? Math.round(((a56.attended - a28.attended) / prevPlanned) * 100) : null;
  const streak = currentStreak(ctx, member, sessions);
  const open = openSession(sessions);
  const inside = open && open.checkIn >= today ? open : undefined;
  const last = sessions[sessions.length - 1];
  const since = daysSinceLastVisit(ctx, sessions);
  const monthNow = new Date(today);
  const monthDays = new Set(
    sessions
      .filter((s) => {
        const d = new Date(s.checkIn);
        return d.getFullYear() === monthNow.getFullYear() && d.getMonth() === monthNow.getMonth();
      })
      .map((s) => dayKey(s.checkIn)),
  ).size;

  const plan = planOf(ctx, member);
  const storedPlan = ctx.store.plans[member.id];
  const nutrition = nutritionOf(ctx, member);
  const series = weightSeries(ctx, member);
  const exerciseName = (exId: string) =>
    plan?.sessions.flatMap((s) => s.exercises).find((e) => e.id === exId)?.name ?? exId;

  // ---------- facts ----------
  const facts: { label: string; text: string; tone?: "red" }[] = [];
  if (a28.planned === 0) {
    facts.push({ label: "Attendance", text: "No planned sessions in the last 28 days, so adherence cannot be measured yet." });
  } else {
    let t = `${a28.pct}% adherence over 28 days (${a28.attended} of ${a28.planned} planned sessions)`;
    if (prevPct !== null && a28.pct !== null) {
      const diff = a28.pct - prevPct;
      t += diff === 0 ? `, level with the 28 days before (${prevPct}%).` : `, ${diff > 0 ? "up" : "down"} ${Math.abs(diff)} points on the 28 days before (${prevPct}%).`;
    } else t += ".";
    facts.push({ label: "Attendance", text: t, tone: a28.pct !== null && a28.pct < 50 ? "red" : undefined });
  }
  if (inside) {
    facts.push({ label: "Visits", text: `Inside the gym since ${fmtTime(inside.checkIn)}.` });
  } else if (since === null) {
    facts.push({ label: "Visits", text: "No visits yet.", tone: member.joinedDaysAgo > 7 ? "red" : undefined });
  } else {
    facts.push({
      label: "Visits",
      text: `Last visit ${agoWords(since)}. Current run: ${streak} ${streak === 1 ? "session" : "sessions"} in a row.`,
      tone: since >= 10 ? "red" : undefined,
    });
  }
  facts.push(
    plan
      ? { label: "Training plan", text: `${plan.title}. ${storedPlan ? `Saved ${fmtDayShort(storedPlan.createdAt)}.` : "Set when they joined."}` }
      : { label: "Training plan", text: "No training plan yet. Use Build training plan to start their schedule.", tone: "red" },
  );
  facts.push({
    label: "Nutrition",
    text: nutrition
      ? `${nutrition.kcal} kcal, ${nutrition.protein} g protein and ${nutrition.waterL} L water a day.`
      : "No nutrition plan yet.",
  });
  const recentLogs = ctx.store.logs.filter((l) => l.memberId === member.id).sort((a, b) => b.at - a.at).slice(0, 3);
  facts.push({
    label: "Loads",
    text: recentLogs.length
      ? recentLogs
          .map((l) => {
            const done = l.sets.filter((s) => s.done).length;
            const loads = l.sets.filter((s) => s.done && s.load).map((s) => s.load as number);
            return `${exerciseName(l.exerciseId)}: ${done}/${l.sets.length} sets${loads.length ? `, top ${Math.max(...loads)} kg` : ""}`;
          })
          .join(". ") + "."
      : "No sets logged in the app yet.",
  });
  if (series.length >= 2) {
    const a = series[0];
    const b = series[series.length - 1];
    const diff = Math.round((b.kg - a.kg) * 10) / 10;
    const weeks = Math.max(1, Math.round((b.ts - a.ts) / (7 * DAY)));
    facts.push({
      label: "Weight",
      text: `${b.kg} kg now, ${diff === 0 ? "unchanged" : `${diff > 0 ? "up" : "down"} ${Math.abs(diff).toFixed(1)} kg`} over ${weeks} weeks.`,
    });
  } else {
    facts.push({ label: "Weight", text: "No weigh-ins logged." });
  }

  const recent = [...sessions].reverse().slice(0, 5);
  const messages = ctx.store.messages.filter((m) => m.memberId === member.id).sort((a, b) => b.at - a.at).slice(0, 5);

  const joinedText =
    member.joinedDaysAgo === 0
      ? "Joined today"
      : member.joinedDaysAgo < 30
        ? `Member for ${member.joinedDaysAgo} days`
        : `Member for ${Math.floor(member.joinedDaysAgo / 30)} months`;

  return (
    <div className="grid gap-4">
      {back}

      <section className="panel panel-pad">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Initials name={member.name} size={64} />
            <div className="min-w-0">
              <div className="kicker">{coach}</div>
              <h1 className="display text-[40px] sm:text-[52px]">{member.name}</h1>
              <div className="text-[14px] text-ink-2">
                {member.tier} · {GOAL_LABEL[member.goal]} · {member.age} years · {joinedText}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            {inside ? (
              <span className="tag tag-green"><span className="live-dot" /> Inside now</span>
            ) : (
              <span className="tag tag-ink">Away</span>
            )}
            <span className="text-[13px] text-ink-2">
              {inside ? `In at ${fmtTime(inside.checkIn)}` : last ? `Last visit ${fmtAgo(last.checkIn, ctx.now)}` : "No visits yet"}
            </span>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => setMsgOpen(true)}>Message {first}</button>
          <button className="btn" onClick={() => setWizard("training")}>
            {plan ? "Change training plan" : "Build training plan"}
          </button>
          <button className="btn" onClick={() => setWizard("nutrition")}>
            {nutrition ? "Change nutrition plan" : "Build nutrition plan"}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Adherence, 28 days"
          value={a28.pct === null ? "–" : `${a28.pct}%`}
          sub={a28.planned ? `${a28.attended} of ${a28.planned} planned` : "No planned days yet"}
          tone={a28.pct !== null && a28.pct < 50 ? "red" : "ink"}
        />
        <Stat label="Streak" value={streak} sub={streak === 1 ? "session in a row" : "sessions in a row"} />
        <Stat label="This month" value={monthDays} sub={monthDays === 1 ? "day trained" : "days trained"} />
        <Stat
          label="Last visit"
          value={inside ? "Now" : since === null ? "–" : since === 0 ? "Today" : `${since} d`}
          sub={inside ? `In at ${fmtTime(inside.checkIn)}` : last ? `${fmtDayShort(last.checkIn)}, ${fmtTime(last.checkIn)}` : "No visits yet"}
          tone={since !== null && since >= 10 ? "red" : "ink"}
        />
      </div>

      <div>
        <div role="tablist" aria-label="Client sections" className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              className="tab"
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "overview" && (
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="grid content-start gap-4 lg:col-span-7">
              <Panel kicker="From the data" title="What to know">
                <dl className="grid">
                  {facts.map((f) => (
                    <div key={f.label} className="grid gap-1 border-b border-line py-3 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[120px_1fr] sm:gap-4">
                      <dt className="kicker pt-0.5">{f.label}</dt>
                      <dd className={`m-0 text-[14px] ${f.tone === "red" ? "font-semibold text-red" : ""}`}>{f.text}</dd>
                    </div>
                  ))}
                </dl>
              </Panel>

              <Panel flush kicker="Check-ins" title="Recent sessions">
                {recent.length === 0 ? (
                  <div className="p-5"><Empty title="No sessions yet" body={`${first} has not checked in. The first visit shows up here.`} /></div>
                ) : (
                  <div className="table-wrap">
                    <table className="log-table min-w-[420px]">
                      <thead>
                        <tr><th>Day</th><th>In</th><th>Out</th><th>Time</th></tr>
                      </thead>
                      <tbody>
                        {recent.map((s) => (
                          <tr key={s.id}>
                            <td>{fmtDayShort(s.checkIn)}</td>
                            <td className="mono">{fmtTime(s.checkIn)}</td>
                            <td className="mono">{s.checkOut ? fmtTime(s.checkOut) : "inside"}</td>
                            <td className="mono">{fmtDuration((s.checkOut ?? ctx.now) - s.checkIn)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </div>

            <Panel className="lg:col-span-5" kicker="Sent to the app" title="Messages">
              {messages.length === 0 ? (
                <Empty
                  title="No messages yet"
                  body={`Nothing has been sent to ${first}.`}
                  action={<button className="btn btn-sm" onClick={() => setMsgOpen(true)}>Message {first}</button>}
                />
              ) : (
                <ul className="grid gap-2">
                  {messages.map((m) => (
                    <li key={m.id} className="border border-line bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold">{m.fromName}</span>
                        <span className="flex items-center gap-2">
                          <span className="mono text-[12px] text-ink-3">{fmtAgo(m.at, ctx.now)}</span>
                          <span className={`tag ${m.read ? "tag-ink" : "tag-yellow"}`}>{m.read ? "Read" : "Unread"}</span>
                        </span>
                      </div>
                      <p className="mt-1.5 text-[14px]">{m.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        )}

        {tab === "calendar" && (
          <Panel kicker="Same calendar the member sees" title="Attendance calendar">
            <Calendar ctx={ctx} member={member} />
          </Panel>
        )}

        {tab === "plan" &&
          (plan ? (
            <PlanView plan={plan} />
          ) : (
            <Empty
              title="No training plan yet"
              body={`Answer five questions on ${first}'s behalf and the plan, weekly schedule and calendar are built from the answers.`}
              action={<button className="btn btn-primary" onClick={() => setWizard("training")}>Build training plan</button>}
            />
          ))}

        {tab === "nutrition" &&
          (nutrition ? (
            <NutritionView plan={nutrition} />
          ) : (
            <Empty
              title="No nutrition plan yet"
              body={`Answer five questions on ${first}'s behalf and targets and meals are calculated from the answers.`}
              action={<button className="btn btn-primary" onClick={() => setWizard("nutrition")}>Build nutrition plan</button>}
            />
          ))}

        {tab === "progress" && <ProgressView ctx={ctx} member={member} />}
      </div>

      {msgOpen && <MessageDialog member={member} fromName={sender.name} fromRole={sender.role} onClose={() => setMsgOpen(false)} />}

      {wizard === "training" && (
        <TrainingWizard
          initial={plan?.intake ?? trainingIntakeFor(member)}
          forName={member.name}
          onClose={() => setWizard(null)}
          onDone={(p) => {
            savePlan(member.id, p);
            setWizard(null);
            setTab("plan");
            toast(`Training plan saved for ${first}. It shows on their calendar from today.`);
          }}
        />
      )}
      {wizard === "nutrition" && (
        <NutritionWizard
          initial={nutrition?.intake ?? nutritionIntakeFor(member)}
          forName={member.name}
          onClose={() => setWizard(null)}
          onDone={(p) => {
            saveNutrition(member.id, p);
            setWizard(null);
            setTab("nutrition");
            toast(`Nutrition plan saved for ${first}.`);
          }}
        />
      )}
    </div>
  );
}
