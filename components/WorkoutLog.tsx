"use client";
import { useEffect, useMemo, useState } from "react";
import type { PlannedExercise, PlannedSession } from "@/lib/types";
import { checkIn, checkOut, setLogEntry } from "@/lib/store";
import { logsFor, openSession, sessionsOf, type Ctx } from "@/lib/selectors";
import type { Member } from "@/lib/seed";
import { dayKey, fmtClock, fmtDuration } from "@/lib/dates";
import { fmtRest } from "./PlanView";
import { Panel, toast } from "./ui";

type Rest = { endsAt: number; total: number; label: string };

export default function WorkoutLog({ ctx, member, session }: { ctx: Ctx; member: Member; session: PlannedSession }) {
  const [loads, setLoads] = useState<Record<string, string>>({});
  const [rest, setRest] = useState<Rest | null>(null);
  const [left, setLeft] = useState(0);

  const sessions = sessionsOf(ctx, member);
  const open = openSession(sessions);
  const checkedIn = !!open;
  const today = dayKey(ctx.now);

  const logMap = useMemo(
    () =>
      new Map(
        logsFor(ctx, member.id, today)
          .filter((l) => l.planSessionId === session.id)
          .map((l) => [l.exerciseId, l]),
      ),
    [ctx, member.id, today, session.id],
  );

  // Latest load from an earlier day, shown as the placeholder so progression is easy to see.
  const prevLoad = useMemo(() => {
    const out = new Map<string, number>();
    const earlier = ctx.store.logs.filter((l) => l.memberId === member.id && l.day !== today).sort((a, b) => a.at - b.at);
    for (const l of earlier) {
      const loadsDone = l.sets.filter((s) => s.done && s.load).map((s) => s.load as number);
      if (loadsDone.length) out.set(l.exerciseId, Math.max(...loadsDone));
    }
    return out;
  }, [ctx.store.logs, member.id, today]);

  useEffect(() => {
    if (!rest) return;
    const tick = () => {
      const ms = rest.endsAt - Date.now();
      if (ms <= 0) {
        setRest(null);
        toast("Rest over. Next set.");
        return;
      }
      setLeft(ms);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [rest]);

  const totalSets = session.exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets = session.exercises.reduce(
    (a, e) => a + Math.min(e.sets, (logMap.get(e.id)?.sets ?? []).filter((s) => s.done).length),
    0,
  );
  const pct = totalSets === 0 ? 0 : Math.round((doneSets / totalSets) * 100);

  function loadShown(ex: PlannedExercise): string {
    if (loads[ex.id] !== undefined) return loads[ex.id];
    const logged = (logMap.get(ex.id)?.sets ?? []).filter((s) => s.done && s.load).map((s) => s.load as number);
    return logged.length ? String(logged[logged.length - 1]) : "";
  }

  function toggle(ex: PlannedExercise, i: number) {
    if (!checkedIn) return;
    const log = logMap.get(ex.id);
    if (log?.sets[i]?.done) {
      setLogEntry(member.id, session.id, ex.id, ex.sets, i, { done: false });
      return;
    }
    const n = Number(loadShown(ex));
    setLogEntry(member.id, session.id, ex.id, ex.sets, i, Number.isFinite(n) && n > 0 ? { done: true, load: n } : { done: true });
    setRest({ endsAt: Date.now() + ex.restSec * 1000, total: ex.restSec, label: ex.name });
  }

  function commitLoad(ex: PlannedExercise) {
    const n = Number(loadShown(ex));
    if (!Number.isFinite(n) || n <= 0) return;
    (logMap.get(ex.id)?.sets ?? []).forEach((s, i) => {
      if (s.done && s.load !== n) setLogEntry(member.id, session.id, ex.id, ex.sets, i, { load: n });
    });
  }

  function finish() {
    const dur = open ? fmtDuration(Date.now() - open.checkIn) : "";
    setRest(null);
    checkOut(member.id);
    toast(`Session finished. ${doneSets} of ${totalSets} sets logged in ${dur}.`);
  }

  return (
    <>
      <Panel
        flush
        kicker={`Session · about ${session.estMinutes} min`}
        title={session.name}
        right={<span className="mono text-[14px] font-medium">{doneSets} of {totalSets} sets</span>}
      >
        <div className="h-3 border-b border-ink bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={totalSets} aria-valuenow={doneSets} aria-label="Sets completed">
          <div className="h-full bg-green" style={{ width: `${pct}%` }} />
        </div>

        <div className="px-5 pt-4">
          <p className="muted text-[14px]">{session.focus}</p>
          {!checkedIn && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-yellow-bg px-3 py-2.5">
              <span className="text-[14px] font-semibold">Check in to start logging sets.</span>
              <button className="btn btn-primary btn-sm" onClick={() => checkIn(member.id)}>
                Check in now
              </button>
            </div>
          )}
          <div className="panel-flat mt-4 p-3">
            <div className="kicker mb-1.5">Warm-up</div>
            <ul className="grid gap-1 text-[14px]">
              {session.warmup.map((w, k) => (
                <li key={k} className="flex gap-3">
                  <span className="mt-[7px] h-2 w-2 shrink-0 bg-ink" aria-hidden />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ol className="mt-2">
          {session.exercises.map((ex, n) => {
            const log = logMap.get(ex.id);
            const prev = prevLoad.get(ex.id);
            return (
              <li key={ex.id} className="grid gap-3 border-b border-line px-5 py-4 last:border-b-0 md:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-3">
                    <span className="num text-[30px] text-ink-3" aria-hidden>{n + 1}</span>
                    <h3 className="text-[18px] font-bold leading-tight">{ex.name}</h3>
                  </div>
                  <div className="mono mt-1 text-[13px] text-ink-2">
                    {ex.sets} × {ex.reps} · rest {fmtRest(ex.restSec)} · RPE {ex.rpe}
                    {ex.tempo ? ` · tempo ${ex.tempo}` : ""}
                  </div>
                  <p className="mt-1.5 text-[14px]">{ex.cue}</p>
                  {ex.note && (
                    <span className="tag tag-blue mt-2 !whitespace-normal !normal-case !tracking-normal">{ex.note}</span>
                  )}
                </div>
                <div className="grid content-start gap-2.5 md:justify-items-end">
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: ex.sets }, (_, i) => {
                      const done = log?.sets[i]?.done ?? false;
                      return (
                        <button
                          key={i}
                          className="setbox"
                          aria-pressed={done}
                          aria-label={`${ex.name}, set ${i + 1} of ${ex.sets}, ${done ? "done" : "not done"}`}
                          disabled={!checkedIn}
                          onClick={() => toggle(ex, i)}
                        >
                          {done ? "✓" : i + 1}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="field-label !mb-0" htmlFor={`load-${ex.id}`}>Load (kg)</label>
                    <input
                      id={`load-${ex.id}`}
                      className="input !min-h-[38px] !w-[110px]"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={500}
                      step={0.5}
                      placeholder={prev ? `Last ${prev}` : "kg"}
                      value={loadShown(ex)}
                      onChange={(e) => setLoads((cur) => ({ ...cur, [ex.id]: e.target.value }))}
                      onBlur={() => commitLoad(ex)}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {session.finisher && (
          <div className="mx-5 mb-5 mt-1 panel-flat p-3">
            <div className="kicker">Finisher</div>
            <div className="font-semibold">{session.finisher.name}</div>
            <div className="muted text-[14px]">{session.finisher.detail}</div>
          </div>
        )}

        {checkedIn && (
          <div className="border-t-2 border-ink p-5">
            <button className="btn btn-dark w-full sm:w-auto" onClick={finish}>
              Finish session
            </button>
            <span className="muted ml-0 mt-2 block text-[13px] sm:ml-4 sm:mt-0 sm:inline">
              Checks you out and records {doneSets} of {totalSets} sets.
            </span>
          </div>
        )}
      </Panel>

      {rest && <div className="h-24" aria-hidden />}
      {rest && (
        <div className="fixed inset-x-0 bottom-0 z-[55] border-t-4 border-yellow bg-ink text-white" role="timer">
          <div className="h-1.5 bg-white/20">
            <div className="h-full bg-yellow" style={{ width: `${Math.min(100, (left / (rest.total * 1000)) * 100)}%` }} />
          </div>
          <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-4 py-3">
            <div className="num text-[44px] text-yellow">{fmtClock(left)}</div>
            <div className="min-w-0 flex-1">
              <div className="kicker !text-white opacity-70">Rest</div>
              <div className="truncate text-[14px] font-semibold">{rest.label}</div>
            </div>
            <button className="btn btn-sm !border-white !bg-transparent !text-white !shadow-none" onClick={() => setRest(null)}>
              Skip
            </button>
          </div>
        </div>
      )}
    </>
  );
}
