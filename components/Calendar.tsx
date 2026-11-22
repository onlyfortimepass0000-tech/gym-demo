"use client";
import { useMemo, useState } from "react";
import {
  MONTHS_LONG, WEEKDAYS_SHORT, addDays, dayKey, fmtDayLong, fmtDuration, fmtTime, monthGrid, startOfDay,
} from "@/lib/dates";
import {
  dayInfo, groupByDay, logsFor, planOf, sessionsOf, plannedWeekdays,
  type Ctx, type DayInfo,
} from "@/lib/selectors";
import type { Member } from "@/lib/seed";

const compact = (ts: number) => fmtTime(ts).replace(" am", "a").replace(" pm", "p");

function cellLabel(info: DayInfo): string {
  const d = new Date(info.ts);
  const date = `${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`;
  switch (info.status) {
    case "attended": {
      const s = info.sessions[0];
      return `${date}, attended, checked in ${fmtTime(s.checkIn)}`;
    }
    case "inside": return `${date}, inside the gym now`;
    case "missed": return `${date}, missed a planned session`;
    case "planned": return `${date}, session planned`;
    case "pre": return `${date}, before joining`;
    default: return `${date}, rest day`;
  }
}

function Cell({
  info, inMonth, today, selected, onPick,
}: {
  info: DayInfo; inMonth: boolean; today: boolean; selected: boolean; onPick: () => void;
}) {
  const d = new Date(info.ts).getDate();
  const cls = [
    "cal-cell",
    !inMonth ? "cal-out" : `cal-${info.status}`,
    today ? "cal-today" : "",
    selected ? "cal-selected" : "",
  ].join(" ");
  const first = info.sessions[0];

  return (
    <button className={cls} onClick={onPick} aria-label={cellLabel(info)} aria-pressed={selected}>
      <span className="d">{d}</span>
      {inMonth && (
        <span className="flex flex-col items-start gap-0.5">
          {info.status === "attended" && first && (
            <>
              <span className="plate" aria-hidden>✓</span>
              <span className="lbl lbl-time">{compact(first.checkIn)}</span>
            </>
          )}
          {info.status === "inside" && (
            <span className="lbl flex items-center gap-1.5 !text-green">
              <span className="live-dot" /> In
            </span>
          )}
          {info.status === "missed" && <span className="lbl">Missed</span>}
          {info.status === "planned" && (
            <span className="lbl truncate">{info.planned ? info.planned.name.replace(/^Full body /, "Full ") : "Planned"}</span>
          )}
          {info.status === "rest" && <span className="lbl">Rest</span>}
        </span>
      )}
    </button>
  );
}

function Swatch({ kind, label }: { kind: "attended" | "missed" | "planned" | "rest" | "today"; label: string }) {
  const style: Record<string, string> = {
    attended: "bg-green-bg border-green",
    missed: "border-red",
    planned: "bg-white border-dashed border-ink-3",
    rest: "bg-white border-line",
    today: "bg-white border-yellow border-[3px]",
  };
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-ink-2">
      <span
        className={`inline-block h-4 w-4 border ${style[kind]}`}
        style={
          kind === "missed"
            ? { backgroundColor: "var(--red-bg)", backgroundImage: "repeating-linear-gradient(135deg, rgba(200,55,43,.35) 0 2px, transparent 2px 5px)" }
            : undefined
        }
      />
      {label}
    </span>
  );
}

export default function Calendar({ ctx, member }: { ctx: Ctx; member: Member }) {
  const today = startOfDay(ctx.now);
  const [cursor, setCursor] = useState(() => {
    const d = new Date(today);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState(dayKey(today));

  const sessions = useMemo(() => sessionsOf(ctx, member), [ctx, member]);
  const byDay = useMemo(() => groupByDay(sessions), [sessions]);
  const weeks = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);
  const infoOf = (ts: number) => dayInfo(ctx, member, ts, byDay);

  const joined = today - member.joinedDaysAgo * 86400000;
  const joinedMonth = new Date(joined);
  const canPrev = cursor.y > joinedMonth.getFullYear() || (cursor.y === joinedMonth.getFullYear() && cursor.m > joinedMonth.getMonth());
  const nowMonth = new Date(today);
  const canNext = cursor.y < nowMonth.getFullYear() || (cursor.y === nowMonth.getFullYear() && cursor.m < nowMonth.getMonth() + 1);

  function shift(delta: number) {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  }

  // month stats
  const stats = useMemo(() => {
    let attended = 0, missed = 0, trained = 0;
    for (const row of weeks) for (const g of row) {
      if (!g.inMonth) continue;
      const i = dayInfo(ctx, member, g.ts, byDay);
      if (i.status === "attended" || i.status === "inside") {
        attended++;
        for (const s of i.sessions) trained += (s.checkOut ?? ctx.now) - s.checkIn;
      } else if (i.status === "missed") missed++;
    }
    const planned = attended + missed;
    return { attended, missed, trained, pct: planned === 0 ? null : Math.round((attended / planned) * 100) };
  }, [weeks, ctx, member, byDay]);

  const sel = dayInfo(ctx, member, new Date(selected + "T00:00:00").getTime(), byDay);
  const plan = planOf(ctx, member);
  const logs = logsFor(ctx, member.id, selected);
  const hasPlanDays = plannedWeekdays(ctx, member).length > 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="display text-[30px]">
          {MONTHS_LONG[cursor.m]} <span className="text-ink-3">{cursor.y}</span>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-sm" onClick={() => shift(-1)} disabled={!canPrev} aria-label="Previous month">←</button>
          <button
            className="btn btn-sm"
            onClick={() => {
              const d = new Date(today);
              setCursor({ y: d.getFullYear(), m: d.getMonth() });
              setSelected(dayKey(today));
            }}
          >
            Today
          </button>
          <button className="btn btn-sm" onClick={() => shift(1)} disabled={!canNext} aria-label="Next month">→</button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="panel-flat px-3 py-2">
          <div className="kicker">Attended</div>
          <div className="num text-[30px] text-green">{stats.attended}</div>
        </div>
        <div className="panel-flat px-3 py-2">
          <div className="kicker">Missed</div>
          <div className={`num text-[30px] ${stats.missed ? "text-red" : ""}`}>{stats.missed}</div>
        </div>
        <div className="panel-flat px-3 py-2">
          <div className="kicker">Adherence</div>
          <div className="num text-[30px]">{stats.pct === null ? "–" : `${stats.pct}%`}</div>
        </div>
        <div className="panel-flat px-3 py-2">
          <div className="kicker">Time trained</div>
          <div className="num text-[30px]">{stats.trained ? fmtDuration(stats.trained).replace(" min", "m").replace(" h ", "h ").replace(" m", "m") : "0m"}</div>
        </div>
      </div>

      <div className="cal-grid" role="grid" aria-label={`${MONTHS_LONG[cursor.m]} ${cursor.y} attendance`}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="cal-dow">{d}</div>
        ))}
        {weeks.flat().map((g) => {
          const info = infoOf(g.ts);
          return (
            <Cell
              key={g.ts}
              info={info}
              inMonth={g.inMonth}
              today={g.ts === today}
              selected={dayKey(g.ts) === selected}
              onPick={() => {
                setSelected(dayKey(g.ts));
                if (!g.inMonth) {
                  const d = new Date(g.ts);
                  setCursor({ y: d.getFullYear(), m: d.getMonth() });
                }
              }}
            />
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Legend">
        <Swatch kind="attended" label="Came in" />
        <Swatch kind="missed" label="Missed a planned day" />
        <Swatch kind="planned" label="Planned" />
        <Swatch kind="rest" label="Rest day" />
        <Swatch kind="today" label="Today" />
      </div>
      {!hasPlanDays && (
        <p className="muted mt-3 text-[13px]">
          No training days are scheduled yet, so nothing can be marked as missed. Build a plan and the schedule appears here.
        </p>
      )}

      <div className="mt-5 border-2 border-ink bg-white p-4" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="display text-[24px]">{fmtDayLong(sel.ts)}</div>
          <span
            className={`tag ${
              sel.status === "attended" || sel.status === "inside" ? "tag-green"
              : sel.status === "missed" ? "tag-red"
              : sel.status === "planned" ? "tag-yellow" : "tag-ink"
            }`}
          >
            {sel.status === "attended" ? "Came in" : sel.status === "inside" ? "In the gym now" :
             sel.status === "missed" ? "Missed" : sel.status === "planned" ? "Planned" :
             sel.status === "pre" ? "Before joining" : "Rest day"}
          </span>
        </div>

        {sel.sessions.length === 0 && (
          <p className="muted mt-2 text-[14px]">
            {sel.status === "missed" && `No check-in${sel.planned ? ` for ${sel.planned.name}` : ""}. This was a planned training day.`}
            {sel.status === "planned" && (sel.planned ? `${sel.planned.name} is planned: ${sel.planned.focus}.` : "A training day is planned.")}
            {sel.status === "rest" && "No session planned. Recovery is part of the plan."}
            {sel.status === "pre" && "Membership had not started yet."}
          </p>
        )}

        {sel.sessions.map((s) => (
          <div key={s.id} className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-line pt-3">
            <div>
              <div className="kicker">In</div>
              <div className="mono font-medium">{fmtTime(s.checkIn)}</div>
            </div>
            <div>
              <div className="kicker">Out</div>
              <div className="mono font-medium">{s.checkOut ? fmtTime(s.checkOut) : "still inside"}</div>
            </div>
            <div>
              <div className="kicker">Time</div>
              <div className="mono font-medium">{fmtDuration((s.checkOut ?? ctx.now) - s.checkIn)}</div>
            </div>
            {sel.planned && (
              <div>
                <div className="kicker">Session</div>
                <div className="font-semibold">{sel.planned.name}</div>
              </div>
            )}
          </div>
        ))}

        {logs.length > 0 && (
          <div className="mt-3 border-t border-line pt-3">
            <div className="kicker mb-1.5">Sets logged</div>
            <ul className="grid gap-1 text-[14px]">
              {logs.map((l) => {
                const ex = plan?.sessions.flatMap((s) => s.exercises).find((e) => e.id === l.exerciseId);
                const done = l.sets.filter((x) => x.done).length;
                const loads = l.sets.filter((x) => x.done && x.load).map((x) => x.load);
                return (
                  <li key={l.id} className="flex flex-wrap items-baseline justify-between gap-2">
                    <span>{ex?.name ?? l.exerciseId}</span>
                    <span className="mono text-ink-2">
                      {done}/{l.sets.length} sets{loads.length ? ` · ${Math.max(...(loads as number[]))} kg top` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
