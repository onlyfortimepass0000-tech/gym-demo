"use client";
import { useEffect, useState } from "react";
import { WEEKDAYS_LONG, WEEKDAYS_SHORT, addDays, dayKey, fmtAgo, fmtClock, fmtDayLong, fmtDuration, fmtTime, startOfDay } from "@/lib/dates";
import { checkIn, checkOut, markMessagesRead, saveNutrition, savePlan } from "@/lib/store";
import {
  adherence, currentStreak, dayInfo, groupByDay, memberById, nutritionOf, openSession, planOf, sessionForWeekday, sessionsOf, weeklyCounts,
  type Ctx,
} from "@/lib/selectors";
import { useCtx } from "@/lib/useCtx";
import Calendar from "./Calendar";
import NutritionView from "./NutritionView";
import NutritionWizard from "./NutritionWizard";
import PlanView from "./PlanView";
import ProgressView from "./ProgressView";
import QRSheet from "./QRSheet";
import TrainingWizard from "./TrainingWizard";
import WorkoutLog from "./WorkoutLog";
import { Empty, PageSkeleton, Panel, Stat, toast } from "./ui";

type TabKey = "today" | "calendar" | "plan" | "nutrition" | "progress";
const TABS: { key: TabKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "calendar", label: "Calendar" },
  { key: "plan", label: "Plan" },
  { key: "nutrition", label: "Nutrition" },
  { key: "progress", label: "Progress" },
];

function useSecond(active: boolean): number {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setT(Date.now());
    const id = window.setInterval(() => setT(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return t;
}

const PLAN_QUESTIONS = ["How much lifting you have done", "Days per week and minutes per session", "Your main goal", "Any joints to work around", "The equipment you will use"];
const NUTRITION_QUESTIONS = ["Your goal", "Your diet, and anything to avoid", "Age, height and weight", "How active your day is", "How many meals you want"];

export default function MemberHome({ memberId }: { memberId: "karan" | "riya" }) {
  const ctx = useCtx();
  if (!ctx) return <PageSkeleton />;
  return <Inner ctx={ctx} memberId={memberId} />;
}

function Inner({ ctx, memberId }: { ctx: Ctx; memberId: "karan" | "riya" }) {
  const member = memberById(ctx, memberId);
  const [tab, setTab] = useState<TabKey>("today");
  const [showQR, setShowQR] = useState(false);
  const [trainWiz, setTrainWiz] = useState(false);
  const [nutWiz, setNutWiz] = useState(false);
  const [extraId, setExtraId] = useState<string | null>(null);

  const sessions = member ? sessionsOf(ctx, member) : [];
  const open = openSession(sessions);
  const tick = useSecond(!!open);

  if (!member) return null;

  const plan = planOf(ctx, member);
  const nutrition = nutritionOf(ctx, member);
  const adh = adherence(ctx, member, sessions, 28);
  const streak = currentStreak(ctx, member, sessions);
  const week = weeklyCounts(ctx, sessions, 1)[0]?.count ?? 0;
  const todayWd = new Date(ctx.now).getDay();
  const todaySession = sessionForWeekday(plan, todayWd);
  const todayKey = dayKey(ctx.now);
  const doneToday = !open ? sessions.filter((s) => dayKey(s.checkIn) === todayKey && s.checkOut).at(-1) : undefined;
  const unread = ctx.store.messages.filter((m) => m.memberId === memberId && !m.read).sort((a, b) => a.at - b.at);

  let next: { wd: number; name: string; focus: string; lines: string[] } | null = null;
  if (plan && !todaySession) {
    for (let off = 1; off <= 7; off++) {
      const wd = (todayWd + off) % 7;
      const s = sessionForWeekday(plan, wd);
      if (s) {
        next = { wd, name: s.name, focus: s.focus, lines: s.exercises.map((e) => `${e.name}  ${e.sets} × ${e.reps}`) };
        break;
      }
    }
  }

  const extra = plan && extraId ? plan.sessions.find((s) => s.id === extraId) : undefined;

  const byDay = groupByDay(sessions);
  const mondayOffset = (new Date(ctx.now).getDay() + 6) % 7;
  const weekStart = addDays(startOfDay(ctx.now), -mondayOffset);
  const weekStrip = Array.from({ length: 7 }, (_, i) => {
    const ts = addDays(weekStart, i);
    const info = dayInfo(ctx, member, ts, byDay);
    const dow = WEEKDAYS_SHORT[(i + 1) % 7];
    const map = {
      attended: { mark: "✓", cls: "bg-green text-white", aria: "came in" },
      inside: { mark: "●", cls: "bg-green text-white", aria: "inside now" },
      missed: { mark: "✕", cls: "bg-red text-white", aria: "missed" },
      planned: { mark: info.planned ? info.planned.name.replace(/^Full body /, "").slice(0, 1) : "·", cls: "border-2 border-dashed border-[#9a9ea8] text-white", aria: "planned" },
      rest: { mark: "–", cls: "border border-[#3a3e48] text-[#6f7480]", aria: "rest day" },
      pre: { mark: "", cls: "border border-[#3a3e48]", aria: "before joining" },
    }[info.status];
    return { key: info.key, dow, today: ts === startOfDay(ctx.now), mark: map.mark, cls: map.cls, aria: `${dow}: ${map.aria}` };
  });

  let status: string;
  if (open) status = `Inside since ${fmtTime(open.checkIn)}.`;
  else if (doneToday) status = `Done for today. Checked out at ${fmtTime(doneToday.checkOut as number)}.`;
  else if (!plan) status = "No plan yet. Answer five questions to get one.";
  else if (todaySession) status = `Today is ${todaySession.name}, about ${todaySession.estMinutes} min.`;
  else status = next ? `Rest day. Next up: ${WEEKDAYS_LONG[next.wd]}, ${next.name}.` : "Rest day.";

  function doCheckOut() {
    const dur = open ? fmtDuration(Date.now() - open.checkIn) : "";
    checkOut(memberId);
    toast(`Checked out. ${dur} in the gym.`);
  }

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="panel-ink flex min-w-0 flex-col border-t-[6px] !border-t-yellow p-5 sm:p-7">
          <div className="kicker">{fmtDayLong(ctx.now)}</div>
          <h1 className="display mt-2 text-[clamp(44px,9vw,76px)]">{member.name}</h1>
          <p className="mt-3 flex items-center gap-2.5 text-[15px] text-white">
            {open && <span className="live-dot" aria-hidden />}
            {status}
          </p>

          {open ? (
            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
              <div>
                <div className="kicker">Time inside</div>
                <div className="num mono text-[clamp(48px,9vw,72px)] text-yellow" aria-live="off">
                  {fmtClock(tick - open.checkIn)}
                </div>
              </div>
              <button className="btn btn-xl btn-dark !border-white" onClick={doCheckOut}>
                Check out
              </button>
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="btn btn-primary btn-xl"
                onClick={() => {
                  checkIn(memberId);
                  toast("Checked in. Your trainer and the front desk can see you.");
                }}
              >
                Check in
              </button>
              <button className="btn btn-xl" onClick={() => setShowQR(true)}>
                Show QR
              </button>
            </div>
          )}

          <div className="mt-auto pt-8">
            <div className="kicker mb-2">This week</div>
            <div className="grid grid-cols-7 gap-1.5" role="list" aria-label="This week at a glance">
              {weekStrip.map((d) => (
                <div key={d.key} role="listitem" aria-label={d.aria} className="min-w-0">
                  <div className="mono mb-1 text-center text-[10px] uppercase tracking-wider text-[#9a9ea8]">{d.dow}</div>
                  <div
                    className={`grid h-11 place-items-center text-[15px] font-bold sm:h-12 ${d.cls} ${d.today ? "outline outline-[3px] outline-offset-1 outline-yellow" : ""}`}
                  >
                    {d.mark}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-3">
          <Stat
            label="28-day adherence"
            value={adh.pct === null ? "–" : `${adh.pct}%`}
            tone={adh.pct === null ? "ink" : adh.pct >= 75 ? "green" : adh.pct < 50 ? "red" : "ink"}
            sub={adh.planned ? `${adh.attended} of ${adh.planned} planned days` : "No planned days yet"}
          />
          <Stat label="Streak" value={streak} sub={streak === 1 ? "session in a row" : "sessions in a row"} />
          <Stat label="This week" value={week} sub={plan ? `of ${plan.weekdays.length} planned` : "sessions"} />
        </div>
      </div>

      {unread.length > 0 && (
        <section className="border-2 border-ink bg-yellow p-4" aria-label="Messages">
          <div className="grid gap-3">
            {unread.map((m) => (
              <div key={m.id}>
                <div className="kicker !text-ink">{m.fromName} · {fmtAgo(m.at, ctx.now)}</div>
                <p className="mt-0.5 text-[16px] font-semibold">{m.body}</p>
              </div>
            ))}
          </div>
          <button className="btn btn-sm mt-3" onClick={() => markMessagesRead(memberId)}>
            Mark as read
          </button>
        </section>
      )}

      <div>
        <div role="tablist" aria-label="Member sections" className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={tab === t.key}
              aria-controls={`panel-${t.key}`}
              className="tab"
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-5">
          {tab === "today" && (
            <>
              {!plan && (
                <section className="panel panel-pad">
                  <div className="kicker">New plan</div>
                  <h2 className="display mt-1 max-w-2xl text-[clamp(34px,6vw,54px)]">
                    Five questions. One plan built around your answers.
                  </h2>
                  <p className="muted mt-3 max-w-2xl">
                    You get a weekly schedule on fixed days with the exercises, sets, reps, rest times and effort target for
                    every session. Sessions are sized to the minutes you have, and exercises that load a sore joint are swapped
                    for safer ones.
                  </p>
                  <ul className="mt-4 grid gap-1.5 text-[14px]">
                    {PLAN_QUESTIONS.map((q, i) => (
                      <li key={q} className="flex gap-3">
                        <span className="mono w-5 text-ink-3">{i + 1}</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="btn btn-primary btn-xl mt-6" onClick={() => setTrainWiz(true)}>
                    Build my plan
                  </button>
                </section>
              )}

              {plan && todaySession && <WorkoutLog ctx={ctx} member={member} session={todaySession} />}

              {plan && !todaySession && extra && (
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="muted text-[14px]">Extra session on a rest day. It shows on your calendar as a visit.</p>
                    <button className="btn btn-ghost btn-sm" onClick={() => setExtraId(null)}>
                      Back to rest day
                    </button>
                  </div>
                  <WorkoutLog ctx={ctx} member={member} session={extra} />
                </div>
              )}

              {plan && !todaySession && !extra && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="panel panel-pad">
                    <div className="kicker">{WEEKDAYS_LONG[todayWd]}</div>
                    <h2 className="display mt-1 text-[44px]">Rest day</h2>
                    <p className="muted mt-2">
                      No session is planned today. Muscle is built while you recover, so keep it light: a walk and enough sleep.
                    </p>
                    <div className="rule" />
                    <div className="kicker mb-2">Train anyway</div>
                    <div className="flex flex-wrap gap-2">
                      {plan.sessions.map((s) => (
                        <button key={s.id} className="btn btn-sm" onClick={() => setExtraId(s.id)}>
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </section>
                  {next && (
                    <Panel kicker={`Next · ${WEEKDAYS_LONG[next.wd]}`} title={next.name}>
                      <p className="muted text-[14px]">{next.focus}</p>
                      <ul className="mono mt-3 grid gap-1 text-[13px]">
                        {next.lines.map((l) => (
                          <li key={l} className="flex gap-3 border-b border-line pb-1 last:border-b-0">
                            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-ink" aria-hidden />
                            <span className="whitespace-pre-wrap">{l}</span>
                          </li>
                        ))}
                      </ul>
                    </Panel>
                  )}
                </div>
              )}
            </>
          )}

          {tab === "calendar" && (
            <Panel kicker="Attendance" title="Calendar">
              <Calendar ctx={ctx} member={member} />
            </Panel>
          )}

          {tab === "plan" &&
            (plan ? (
              <div className="grid gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="muted text-[14px]">Built {fmtAgo(plan.createdAt, ctx.now)} from your five answers.</p>
                  <button className="btn" onClick={() => setTrainWiz(true)}>
                    Change my answers
                  </button>
                </div>
                <PlanView plan={plan} />
              </div>
            ) : (
              <Empty
                title="No plan yet"
                body="Answer five questions and the plan is built on the spot: days, exercises, sets, reps and rest."
                action={<button className="btn btn-primary" onClick={() => setTrainWiz(true)}>Build my plan</button>}
              />
            ))}

          {tab === "nutrition" &&
            (nutrition ? (
              <div className="grid gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="muted text-[14px]">Estimates from your body numbers. Not medical advice.</p>
                  <button className="btn" onClick={() => setNutWiz(true)}>
                    Redo intake
                  </button>
                </div>
                <NutritionView plan={nutrition} />
              </div>
            ) : (
              <section className="panel panel-pad">
                <div className="kicker">Nutrition</div>
                <h2 className="display mt-1 max-w-2xl text-[clamp(32px,5vw,46px)]">
                  Calories, macros and a day of meals from five answers.
                </h2>
                <p className="muted mt-3 max-w-2xl">
                  Targets come from your resting burn and activity. Meals are built from real portions of food you eat, matched to
                  your diet and anything you avoid.
                </p>
                <ul className="mt-4 grid gap-1.5 text-[14px]">
                  {NUTRITION_QUESTIONS.map((q, i) => (
                    <li key={q} className="flex gap-3">
                      <span className="mono w-5 text-ink-3">{i + 1}</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
                <button className="btn btn-primary btn-xl mt-6" onClick={() => setNutWiz(true)}>
                  Start nutrition intake
                </button>
              </section>
            ))}

          {tab === "progress" && <ProgressView ctx={ctx} member={member} />}
        </div>
      </div>

      {showQR && <QRSheet memberId={memberId} onClose={() => setShowQR(false)} />}

      {trainWiz && (
        <TrainingWizard
          initial={plan?.intake}
          onClose={() => setTrainWiz(false)}
          onDone={(p) => {
            savePlan(memberId, p);
            setTrainWiz(false);
            setExtraId(null);
            setTab("plan");
            toast(`Plan ready: ${p.title}.`);
          }}
        />
      )}

      {nutWiz && (
        <NutritionWizard
          initial={nutrition?.intake}
          onClose={() => setNutWiz(false)}
          onDone={(p) => {
            saveNutrition(memberId, p);
            setNutWiz(false);
            setTab("nutrition");
            toast(`Nutrition plan ready: ${p.kcal.toLocaleString("en-IN")} kcal a day.`);
          }}
        />
      )}
    </div>
  );
}
