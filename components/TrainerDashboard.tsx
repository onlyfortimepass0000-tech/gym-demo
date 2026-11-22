"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCtx } from "@/lib/useCtx";
import {
  activityFeed, adherence, allMembers, currentStreak, daysSinceLastVisit, openSession, planOf,
  plannedWeekdays, riskOf, sessionForWeekday, sessionsOf,
  type Adherence, type Ctx, type Risk,
} from "@/lib/selectors";
import { DEMO_TRAINER_ID, TRAINERS, type Member, type Session } from "@/lib/seed";
import type { PlannedSession } from "@/lib/types";
import { DAY, addDays, dayKey, fmtAgo, fmtDayLong, fmtTime, startOfDay } from "@/lib/dates";
import { Empty, Initials, PageSkeleton, Panel, Stat } from "./ui";
import MessageDialog from "./MessageDialog";

type Row = {
  m: Member;
  adh: Adherence;
  streak: number;
  risk: Risk;
  since: number | null;
  inside: Session | undefined;
  last: Session | undefined;
  todaySession: Session | undefined;
  weekVisits: number;
  weekPlanned: number;
  planLabel: string | null;
  planDue: boolean;
  hasPlan: boolean;
  plannedToday: boolean;
  todayPlan: PlannedSession | undefined;
  reasons: string[];
  severity: number;
};

const GOAL_LABEL: Record<Member["goal"], string> = {
  "fat-loss": "Fat loss",
  muscle: "Muscle gain",
  strength: "Strength",
  general: "General fitness",
};

const RISK_ORDER: Record<Risk, number> = { risk: 0, watch: 1, new: 2, ok: 3 };
const RISK_TAG: Record<Risk, { cls: string; text: string }> = {
  risk: { cls: "tag-red", text: "At risk" },
  watch: { cls: "tag-yellow", text: "Watch" },
  new: { cls: "tag-blue", text: "New" },
  ok: { cls: "tag-green", text: "OK" },
};

function buildRows(ctx: Ctx, clients: Member[]): Row[] {
  const today = startOfDay(ctx.now);
  const todayKey = dayKey(today);
  const weekday = new Date(today).getDay();
  const weekStart = addDays(today, -((weekday + 6) % 7));

  const rows = clients.map((m): Row => {
    const sessions = sessionsOf(ctx, m);
    const adh = adherence(ctx, m, sessions, 28);
    const a14 = adherence(ctx, m, sessions, 14);
    const risk = riskOf(ctx, m, sessions);
    const since = daysSinceLastVisit(ctx, sessions);
    const open = openSession(sessions);
    const inside = open && open.checkIn >= today ? open : undefined;
    const last = sessions[sessions.length - 1];
    const todaySession = [...sessions].reverse().find((s) => dayKey(s.checkIn) === todayKey);
    const weekVisits = new Set(
      sessions.filter((s) => s.checkIn >= weekStart && s.checkIn <= ctx.now).map((s) => dayKey(s.checkIn)),
    ).size;
    const weekdays = plannedWeekdays(ctx, m);
    const plan = planOf(ctx, m);
    const stored = ctx.store.plans[m.id];

    // Seeded plans run as rolling 4-week blocks from the join date; a plan a trainer
    // saved counts from its own creation date and is flagged once it passes week 4.
    let planLabel: string | null = null;
    let planDue = false;
    if (plan) {
      if (stored) {
        const week = Math.floor((today - startOfDay(stored.createdAt)) / (7 * DAY)) + 1;
        if (week > 4) {
          planDue = true;
          planLabel = "Refresh due";
        } else planLabel = `Week ${week} of 4`;
      } else {
        planLabel = `Week ${(Math.floor(m.joinedDaysAgo / 7) % 4) + 1} of 4`;
      }
    }

    const missed14 = a14.planned - a14.attended;
    const reasons: string[] = [];
    let severity = 0;
    if (risk === "risk") {
      reasons.push(since === null ? "Has not visited since joining." : `No visit in ${since} days.`);
      severity += 3;
    } else if (risk === "watch") {
      reasons.push(`No visit in ${since} days.`);
      severity += 2;
    }
    if (risk !== "risk" && missed14 >= 2) {
      reasons.push(`Missed ${missed14} of ${a14.planned} planned sessions in the last 14 days.`);
      severity += 2;
    }
    if (!plan) {
      reasons.push("No plan yet. Build one.");
      severity += 1;
    }

    return {
      m, adh, streak: currentStreak(ctx, m, sessions), risk, since, inside, last, todaySession,
      weekVisits, weekPlanned: weekdays.length, planLabel, planDue, hasPlan: !!plan,
      plannedToday: weekdays.includes(weekday), todayPlan: sessionForWeekday(plan, weekday),
      reasons, severity,
    };
  });

  return rows.sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk] || a.m.name.localeCompare(b.m.name));
}

function Bar({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="mono text-ink-3">–</span>;
  const tone = pct >= 75 ? "bg-green" : pct >= 50 ? "bg-yellow" : "bg-red";
  return (
    <span className="flex items-center gap-2">
      <span className="block h-2 w-16 border border-line-strong bg-panel-2" aria-hidden>
        <span className={`block h-full ${tone}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="mono text-[13px]">{pct}%</span>
    </span>
  );
}

type Filter = "all" | "inside" | "attention" | "new";

export default function TrainerDashboard() {
  const ctx = useCtx();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [msgFor, setMsgFor] = useState<Member | null>(null);

  const trainer = TRAINERS.find((t) => t.id === DEMO_TRAINER_ID)!;
  const clients = useMemo(
    () => (ctx ? allMembers(ctx).filter((m) => m.trainerId === DEMO_TRAINER_ID) : []),
    [ctx],
  );
  const rows = useMemo(() => (ctx ? buildRows(ctx, clients) : []), [ctx, clients]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      const byFilter =
        filter === "all" ||
        (filter === "inside" && !!r.inside) ||
        (filter === "attention" && r.reasons.length > 0) ||
        (filter === "new" && r.risk === "new");
      return byFilter && (!needle || r.m.name.toLowerCase().includes(needle));
    });
  }, [rows, filter, q]);

  const feed = useMemo(() => (ctx ? activityFeed(ctx, clients, 12) : []), [ctx, clients]);

  if (!ctx) return <PageSkeleton />;

  const insideCount = rows.filter((r) => r.inside).length;
  const withPct = rows.filter((r) => r.adh.pct !== null);
  const avgAdh = withPct.length ? Math.round(withPct.reduce((s, r) => s + (r.adh.pct ?? 0), 0) / withPct.length) : null;
  const attention = rows.filter((r) => r.reasons.length > 0).sort((a, b) => b.severity - a.severity);
  const counts: Record<Filter, number> = {
    all: rows.length,
    inside: insideCount,
    attention: attention.length,
    new: rows.filter((r) => r.risk === "new").length,
  };

  // Planned today, plus anyone who actually came in (off-plan visits and members without a plan).
  const board = rows
    .filter((r) => r.plannedToday || r.todaySession)
    .sort((a, b) => {
      const rank = (r: Row) => (r.inside ? 0 : r.todaySession ? 2 : 1);
      return rank(a) - rank(b) || a.m.name.localeCompare(b.m.name);
    });
  const nameOf = (id: string) => clients.find((c) => c.id === id);
  const tomorrowWd = new Date(addDays(startOfDay(ctx.now), 1)).getDay();
  const tomorrowCount = rows.filter((r) => plannedWeekdays(ctx, r.m).includes(tomorrowWd)).length;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="kicker">Trainer dashboard</div>
          <h1 className="display text-[44px] sm:text-[56px]">{trainer.name}</h1>
        </div>
        <span className={`tag ${insideCount > 0 ? "tag-green" : "tag-ink"}`}>
          {insideCount > 0 && <span className="live-dot" />}
          {insideCount} inside now
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Clients" value={rows.length} sub="Assigned to you" />
        <Stat label="Inside now" value={insideCount} tone={insideCount ? "green" : "ink"} sub="Checked in, not out" />
        <Stat label="Adherence, 28 days" value={avgAdh === null ? "–" : `${avgAdh}%`} sub="Planned sessions attended" />
        <Stat label="Need attention" value={attention.length} tone={attention.length ? "red" : "ink"} sub="See the list below" />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel
          className="lg:col-span-7"
          kicker={fmtDayLong(ctx.now)}
          title="Today's board"
          right={<span className="kicker">{board.filter((r) => r.todaySession).length} of {board.length} in</span>}
        >
          {board.length === 0 ? (
            <Empty
              title="No sessions scheduled today"
              body={`Nobody has a session planned. ${tomorrowCount} client${tomorrowCount === 1 ? " is" : "s are"} planned tomorrow. Unplanned check-ins still appear here as they happen.`}
            />
          ) : (
            <ul className="grid gap-2">
              {board.map((r) => {
                const s = r.todaySession;
                const label = r.todayPlan?.name ?? (r.plannedToday ? "Training day" : "Extra visit");
                return (
                  <li key={r.m.id} className="flex flex-wrap items-center gap-3 border border-line bg-white p-3">
                    <Initials name={r.m.name} size={34} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/clients/${r.m.id}?from=trainer`} className="font-semibold underline-offset-2 hover:underline">
                        {r.m.name}
                      </Link>
                      <div className="text-[13px] text-ink-2">
                        {label}
                        {s && (r.inside ? ` · in at ${fmtTime(s.checkIn)}` : s.checkOut ? ` · ${fmtTime(s.checkIn)} to ${fmtTime(s.checkOut)}` : "")}
                      </div>
                    </div>
                    {r.inside ? (
                      <span className="tag tag-green"><span className="live-dot" /> Inside</span>
                    ) : s ? (
                      <span className="tag tag-blue">Done</span>
                    ) : (
                      <span className="tag tag-yellow">Not in yet</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel className="lg:col-span-5" kicker="Follow up" title="Needs attention">
          {attention.length === 0 ? (
            <Empty title="Everyone is on track" body="No client is overdue, behind on sessions or waiting for a plan." />
          ) : (
            <ul className="grid gap-2">
              {attention.slice(0, 8).map((r) => (
                <li key={r.m.id} className="border border-line bg-white p-3">
                  <div className="flex items-start gap-3">
                    <Initials name={r.m.name} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{r.m.name}</div>
                      {r.reasons.map((t) => (
                        <div key={t} className="text-[13px] text-ink-2">{t}</div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap justify-end gap-2">
                    <button className="btn btn-sm" onClick={() => setMsgFor(r.m)}>Message</button>
                    <Link href={`/clients/${r.m.id}?from=trainer`} className="btn btn-sm btn-ghost">
                      {r.hasPlan ? "Open" : "Open and build plan"}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        flush
        kicker={`${shown.length} of ${rows.length} clients`}
        title="Client progress"
        right={
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["all", "All"],
                ["inside", "Inside now"],
                ["attention", "Needs attention"],
                ["new", "New"],
              ] as [Filter, string][]
            ).map(([key, label]) => (
              <button key={key} className="chip !px-3 !py-1.5 !text-[13px]" aria-pressed={filter === key} onClick={() => setFilter(key)}>
                {label} ({counts[key]})
              </button>
            ))}
          </div>
        }
      >
        <div className="border-b border-line px-5 py-3">
          <label className="field-label" htmlFor="client-search">Search clients</label>
          <input
            id="client-search"
            className="input max-w-sm"
            type="search"
            placeholder="Type a name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table className="log-table min-w-[900px]">
            <thead>
              <tr>
                <th>Client</th>
                <th>Status</th>
                <th>This week</th>
                <th>Adherence</th>
                <th>Streak</th>
                <th>Plan</th>
                <th>Risk</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={8} className="muted !py-6 text-center">No clients match this filter.</td>
                </tr>
              )}
              {shown.map((r) => (
                <tr key={r.m.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Initials name={r.m.name} size={32} />
                      <div className="min-w-0">
                        <div className="font-semibold">{r.m.name}</div>
                        <div className="text-[12px] text-ink-2">
                          {GOAL_LABEL[r.m.goal]} · {r.m.tier}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {r.inside ? (
                      <span className="tag tag-green"><span className="live-dot" /> Inside</span>
                    ) : (
                      <span className="tag tag-ink">Away</span>
                    )}
                    <div className="mt-1 text-[12px] text-ink-2">
                      {r.inside
                        ? `Since ${fmtTime(r.inside.checkIn)}`
                        : r.last
                          ? `Last visit ${fmtAgo(r.last.checkIn, ctx.now)}`
                          : "No visits yet"}
                    </div>
                  </td>
                  <td className="mono">
                    {r.weekPlanned ? `${r.weekVisits}/${r.weekPlanned}` : r.weekVisits ? `${r.weekVisits}/–` : "–"}
                  </td>
                  <td><Bar pct={r.adh.pct} /></td>
                  <td className="mono">{r.streak}</td>
                  <td>
                    {r.planLabel ? (
                      <span className={`tag ${r.planDue ? "tag-yellow" : "tag-ink"}`}>{r.planLabel}</span>
                    ) : (
                      <span className="tag tag-yellow">No plan yet</span>
                    )}
                  </td>
                  <td><span className={`tag ${RISK_TAG[r.risk].cls}`}>{RISK_TAG[r.risk].text}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/clients/${r.m.id}?from=trainer`} className="btn btn-sm">Open</Link>
                      <button className="btn btn-sm btn-ghost" onClick={() => setMsgFor(r.m)}>Message</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel kicker="Last 24 hours" title="Live activity">
        {feed.length === 0 ? (
          <Empty title="Nothing yet" body="Check-ins, check-outs and logged sets from your clients show up here as they happen." />
        ) : (
          <ul className="grid gap-x-6 gap-y-1 md:grid-cols-2">
            {feed.map((f, i) => {
              const m = nameOf(f.memberId);
              return (
                <li key={`${f.memberId}-${f.ts}-${i}`} className="flex items-baseline justify-between gap-3 border-b border-line py-2 text-[14px]">
                  <span className="min-w-0">
                    <Link href={`/clients/${f.memberId}?from=trainer`} className="font-semibold underline-offset-2 hover:underline">
                      {m?.name ?? f.memberId}
                    </Link>{" "}
                    {f.text}
                  </span>
                  <span className="mono shrink-0 text-[12px] text-ink-3">{fmtAgo(f.ts, ctx.now)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {msgFor && <MessageDialog member={msgFor} fromName={trainer.name} fromRole="trainer" onClose={() => setMsgFor(null)} />}
    </div>
  );
}
