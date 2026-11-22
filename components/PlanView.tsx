"use client";
import type { TrainingPlan } from "@/lib/types";
import { WEEKDAYS_LONG, WEEKDAYS_SHORT } from "@/lib/dates";
import { Panel } from "./ui";

export function fmtRest(sec: number): string {
  if (sec < 60) return `${sec} s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m} min ${s} s` : `${m} min`;
}

const MON_FIRST = [1, 2, 3, 4, 5, 6, 0];

export default function PlanView({ plan }: { plan: TrainingPlan }) {
  const today = new Date().getDay();
  const bySession = new Map(plan.sessions.map((s) => [s.weekday, s]));

  return (
    <div className="grid gap-4">
      <section className="panel panel-pad">
        <div className="kicker">Your plan</div>
        <h2 className="display mt-1 text-[clamp(32px,5vw,46px)]">{plan.title}</h2>
        <p className="muted mt-3 max-w-3xl">{plan.summary}</p>

        <div className="mt-5 grid grid-cols-7 gap-1" role="list" aria-label="Weekly schedule">
          {MON_FIRST.map((wd) => {
            const s = bySession.get(wd);
            const isToday = wd === today;
            return (
              <div
                key={wd}
                role="listitem"
                aria-label={`${WEEKDAYS_LONG[wd]}: ${s ? s.name : "rest"}${isToday ? ", today" : ""}`}
                className={`min-w-0 border-2 px-1.5 py-2 ${
                  s ? "border-ink bg-white" : "border-line bg-panel-2"
                } ${isToday ? "outline outline-[3px] -outline-offset-2 outline-yellow" : ""}`}
              >
                <div className={`kicker ${isToday ? "!text-ink" : ""}`}>{WEEKDAYS_SHORT[wd]}</div>
                <div className={`mt-1 break-words text-[11px] leading-tight sm:text-[13px] ${s ? "font-bold" : "text-ink-3"}`}>
                  {s ? s.name.replace(/^Full body /, "Full ") : "Rest"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {plan.sessions.map((s, i) => (
        <Panel
          key={s.id}
          flush
          kicker={`Day ${i + 1} · ${WEEKDAYS_LONG[s.weekday]} · about ${s.estMinutes} min`}
          title={s.name}
          right={<span className="muted max-w-md text-[14px]">{s.focus}</span>}
        >
          <div className="px-5 pb-1 pt-4">
            <div className="kicker mb-1.5">Warm-up</div>
            <ul className="grid gap-1 text-[14px]">
              {s.warmup.map((w, k) => (
                <li key={k} className="flex gap-3">
                  <span className="mt-[7px] h-2 w-2 shrink-0 bg-ink" aria-hidden />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="table-wrap mt-3">
            <table className="log-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Exercise</th>
                  <th>Sets × reps</th>
                  <th>Rest</th>
                  <th>RPE</th>
                  <th>Tempo</th>
                  <th>Cue</th>
                </tr>
              </thead>
              <tbody>
                {s.exercises.map((e) => (
                  <tr key={e.id}>
                    <td className="font-semibold">
                      {e.name}
                      {e.note && (
                        <div className="mt-1.5">
                          <span className="tag tag-blue !whitespace-normal !normal-case !tracking-normal">{e.note}</span>
                        </div>
                      )}
                    </td>
                    <td className="mono whitespace-nowrap">{e.sets} × {e.reps}</td>
                    <td className="mono whitespace-nowrap">{fmtRest(e.restSec)}</td>
                    <td className="mono">{e.rpe}</td>
                    <td className="mono">{e.tempo ?? "–"}</td>
                    <td className="text-[14px] text-ink-2">{e.cue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {s.finisher && (
            <div className="m-5 mt-4 panel-flat p-3">
              <div className="kicker">Finisher</div>
              <div className="font-semibold">{s.finisher.name}</div>
              <div className="muted text-[14px]">{s.finisher.detail}</div>
            </div>
          )}
        </Panel>
      ))}

      <Panel flush kicker="Four weeks" title="How it progresses">
        <div className="table-wrap">
          <table className="log-table min-w-[560px]">
            <thead>
              <tr>
                <th>Week</th>
                <th>Focus</th>
                <th>What to do</th>
              </tr>
            </thead>
            <tbody>
              {plan.progression.map((p) => (
                <tr key={p.week}>
                  <td className="num text-[26px]">{p.week}</td>
                  <td className="font-semibold">{p.title}</td>
                  <td className="text-[14px] text-ink-2">{p.instruction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel kicker="Ground rules" title="Read before the first session">
        <ul className="grid gap-2.5">
          {plan.rules.map((r, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-[9px] h-2 w-2 shrink-0 bg-ink" aria-hidden />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
