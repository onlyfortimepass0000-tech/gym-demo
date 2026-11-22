"use client";
import { useMemo, useState } from "react";
import { fmtDayShort } from "@/lib/dates";
import { logWeight } from "@/lib/store";
import { planOf, sessionsOf, weeklyCounts, weightSeries, type Ctx } from "@/lib/selectors";
import type { Member } from "@/lib/seed";
import { Bars, LineChart } from "./Charts";
import { Panel, toast } from "./ui";

export default function ProgressView({ ctx, member }: { ctx: Ctx; member: Member }) {
  const [kg, setKg] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const series = useMemo(() => weightSeries(ctx, member), [ctx, member]);
  const weeks = useMemo(() => weeklyCounts(ctx, sessionsOf(ctx, member), 8), [ctx, member]);

  const topLoads = useMemo(() => {
    const names = new Map<string, string>();
    for (const s of planOf(ctx, member)?.sessions ?? []) for (const e of s.exercises) names.set(e.id, e.name);
    const best = new Map<string, { kg: number; at: number }>();
    for (const l of ctx.store.logs) {
      if (l.memberId !== member.id) continue;
      for (const set of l.sets) {
        if (!set.done || !set.load) continue;
        const cur = best.get(l.exerciseId);
        if (!cur || set.load > cur.kg) best.set(l.exerciseId, { kg: set.load, at: l.at });
      }
    }
    return [...best.entries()]
      .map(([id, v]) => ({ id, name: names.get(id) ?? id, ...v }))
      .sort((a, b) => b.at - a.at)
      .slice(0, 8);
  }, [ctx, member]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = Number(kg);
    if (kg.trim() === "" || !Number.isFinite(v) || v < 30 || v > 200) {
      setErr("Enter a weight from 30 to 200 kg.");
      return;
    }
    setErr(null);
    logWeight(member.id, Math.round(v * 10) / 10);
    setKg("");
    toast(`Logged ${Math.round(v * 10) / 10} kg for today.`);
  }

  const first = series[0];
  const last = series[series.length - 1];
  const delta = first && last ? Math.round((last.kg - first.kg) * 10) / 10 : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel
        kicker="Body weight"
        title="Weight trend"
        right={
          delta !== null && series.length > 1 ? (
            <span className="mono text-[13px] text-ink-2">
              {delta > 0 ? "+" : ""}{delta} kg since {fmtDayShort(first.ts)}
            </span>
          ) : undefined
        }
      >
        <form onSubmit={submit} className="mb-4 flex flex-wrap items-end gap-2.5">
          <div className="min-w-[140px] flex-1">
            <label className="field-label" htmlFor="pv-kg">Today&apos;s weight (kg)</label>
            <input
              id="pv-kg"
              className="input"
              inputMode="decimal"
              placeholder={last ? String(last.kg) : "68.5"}
              value={kg}
              onChange={(e) => setKg(e.target.value)}
              aria-invalid={!!err}
            />
          </div>
          <button type="submit" className="btn btn-primary">Log weight</button>
        </form>
        {err && <p role="alert" className="-mt-2 mb-3 text-[13px] font-semibold text-red">{err}</p>}
        <LineChart
          label="Body weight over time in kilograms"
          unit=" kg"
          points={series.map((s) => ({ x: s.ts, y: s.kg, label: fmtDayShort(s.ts) }))}
        />
      </Panel>

      <Panel kicker="Consistency" title="Training days per week">
        <Bars
          label="Training days per week over the last 8 weeks"
          values={weeks.map((w) => w.count)}
          labels={weeks.map((w) => {
            const d = new Date(w.start);
            return `${d.getDate()}/${d.getMonth() + 1}`;
          })}
          highlight={weeks.length - 1}
          showValues
          height={150}
        />
        <p className="muted mt-3 text-[13px]">Weeks start on Monday. The yellow bar is this week so far.</p>
      </Panel>

      <Panel className="lg:col-span-2" kicker="From your set log" title="Recent top loads">
        {topLoads.length === 0 ? (
          <p className="muted text-[14px]">
            Enter a load in the Today tab and tick a set. Your best weight for each exercise shows up here.
          </p>
        ) : (
          <ul className="grid gap-0">
            {topLoads.map((t) => (
              <li key={t.id} className="flex items-baseline justify-between gap-3 border-b border-line py-2.5 last:border-b-0">
                <span className="font-semibold">{t.name}</span>
                <span className="mono text-[14px]">
                  <span className="font-medium">{t.kg} kg</span>
                  <span className="ml-3 text-ink-3">{fmtDayShort(t.at)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
