import { getDb } from "@/lib/db";
import type { Client } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function TrainerPage() {
  const db = getDb();
  const clients = db
    .prepare(
      "SELECT id, name, plan, adherence, status, last_seen, progress, risk, prs FROM clients ORDER BY id"
    )
    .all() as Client[];

  const inGym = clients.filter((c) => c.status === "in").length;
  const highRisk = clients.filter((c) => c.risk === "high").length;
  const avgAdh = Math.round(clients.reduce((a, c) => a + c.adherence, 0) / Math.max(1, clients.length));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <section className="lg:col-span-12">
        <div className="flex items-end justify-between">
          <div>
            <div className="eyebrow">Coach · Harish B.</div>
            <h1 className="mt-1 font-display text-[clamp(26px,3.5vw,32px)] font-semibold tracking-tight">
              Your clients today
            </h1>
          </div>
          <div className="pill pill-good">
            <span className="dot" /> {inGym} in gym now
          </div>
        </div>
      </section>

      <Tile label="Active clients" value={String(clients.length)} delta="+2 this week" tone="up" />
      <Tile label="Avg adherence" value={`${avgAdh}%`} delta="+4 vs last week" tone="up" />
      <Tile
        label="At risk"
        value={String(highRisk)}
        delta="Needs a nudge"
        tone="down"
        valueColor={highRisk ? "var(--danger)" : "var(--fg)"}
      />

      <section className="lg:col-span-12">
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4" style={{ borderColor: "var(--line)" }}>
            <h3 className="font-display text-base font-semibold">Client progress</h3>
            <div className="flex gap-1.5">
              <button className="btn btn-sm">All</button>
              <button className="btn btn-sm btn-ghost">At risk</button>
              <button className="btn btn-sm btn-ghost">Beginners</button>
            </div>
          </div>
          <div className="overflow-x-auto p-1">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr>
                  {["Client", "Plan", "Status", "Last seen", "Adherence", "Progress", "PRs"].map((h) => (
                    <th
                      key={h}
                      className="px-3.5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em]"
                      style={{ color: "var(--fg-3)", background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td className="px-3.5 py-3 text-[13px]">
                      <span
                        className="mr-2.5 inline-grid h-8 w-8 place-items-center rounded-full text-xs font-semibold"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
                      >
                        {c.name.split(" ").map((x) => x[0]).join("")}
                      </span>
                      <span className="font-medium">{c.name}</span>
                    </td>
                    <td className="muted px-3.5 py-3 text-[13px]">{c.plan}</td>
                    <td className="px-3.5 py-3">
                      {c.status === "in" ? (
                        <span className="pill pill-good">
                          <span className="dot" /> In gym
                        </span>
                      ) : (
                        <span className="pill">
                          <span className="dot" /> Away
                        </span>
                      )}
                    </td>
                    <td className="muted tabular px-3.5 py-3 text-[13px]">{c.last_seen}</td>
                    <td className="px-3.5 py-3 text-[13px]">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`bar ${
                            c.adherence < 60 ? "bar-danger" : c.adherence < 80 ? "bar-warm" : "bar-good"
                          }`}
                          style={{ width: 80 }}
                        >
                          <span style={{ width: `${c.adherence}%` }} />
                        </div>
                        <span className="tabular">{c.adherence}%</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-[13px]">
                      <div className="flex items-center gap-1.5">
                        <div className="bar" style={{ width: 80 }}>
                          <span style={{ width: `${c.progress}%` }} />
                        </div>
                        <span className="tabular">{c.progress}%</span>
                      </div>
                    </td>
                    <td className="tabular px-3.5 py-3 text-[13px]">{c.prs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="lg:col-span-6">
        <div className="card">
          <div className="eyebrow">Needs attention</div>
          <h3 className="mt-1 font-display text-lg font-semibold">3 clients to message today</h3>
          <div className="mt-3.5 flex flex-col gap-2.5">
            <AttentionRow initials="VJ" name="Vikram J." note="Missed 4 sessions. Adherence dropped from 72% → 48%." cta="Nudge" primary />
            <AttentionRow initials="RK" name="Rohan K." note="Hasn't logged weights in 10 days. Form check overdue." cta="Nudge" primary />
            <AttentionRow initials="AP" name="Aditya P." note="Plan expiring Sunday. Needs a new 4-week block." cta="Plan" />
          </div>
        </div>
      </section>

      <section className="lg:col-span-6">
        <div className="card">
          <div className="eyebrow">This week&apos;s sessions</div>
          <h3 className="mt-1 font-display text-lg font-semibold">Trainer-led · 18 of 24 booked</h3>
          <WeekBars heights={[60, 80, 40, 90, 100, 85, 30]} highlightIdx={3} />
          <div className="mt-1.5 flex gap-1.5">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d} className="flex-1 text-center text-[10px]" style={{ color: "var(--fg-3)" }}>
                {d}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  delta,
  tone,
  valueColor,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "up" | "down";
  valueColor?: string;
}) {
  return (
    <section className="lg:col-span-4">
      <div className="tile">
        <div className="k">{label}</div>
        <div className="mt-2 font-display text-[32px] font-semibold tabular tracking-tight" style={valueColor ? { color: valueColor } : undefined}>
          {value}
        </div>
        <div className="mt-1 text-xs font-semibold" style={{ color: tone === "up" ? "var(--good)" : "var(--danger)" }}>
          {delta}
        </div>
      </div>
    </section>
  );
}

function AttentionRow({
  initials,
  name,
  note,
  cta,
  primary,
}: {
  initials: string;
  name: string;
  note: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-[10px] p-3"
      style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
    >
      <span
        className="inline-grid h-8 w-8 place-items-center rounded-full text-xs font-semibold"
        style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{name}</div>
        <div className="muted text-xs">{note}</div>
      </div>
      <button className={primary ? "btn btn-sm btn-primary" : "btn btn-sm"}>{cta}</button>
    </div>
  );
}

function WeekBars({ heights, highlightIdx }: { heights: number[]; highlightIdx: number }) {
  return (
    <div className="mt-5 flex h-[140px] items-end gap-1.5">
      {heights.map((h, i) => (
        <div
          key={i}
          className="min-h-[4px] flex-1 rounded-[4px_4px_2px_2px]"
          style={{
            height: `${h}%`,
            background:
              i === highlightIdx
                ? "var(--warm)"
                : "linear-gradient(180deg, var(--accent) 0%, rgba(212,255,61,0.35) 100%)",
          }}
        />
      ))}
    </div>
  );
}
