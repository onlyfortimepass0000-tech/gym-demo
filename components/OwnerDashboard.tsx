"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BRAND, PLAN_PRICES } from "@/lib/brand";
import {
  DAY, WEEKDAYS_LONG, addDays, dayKey, fmtAgo, fmtDayLong, fmtDayShort, fmtINR, startOfDay,
} from "@/lib/dates";
import { TRAINERS, type Member, type PlanTier, type Session } from "@/lib/seed";
import {
  adherence, allMembers, daysSinceLastVisit, daysToRenewal, hourlyCheckIns, monthlyValue,
  openSession, pendingSignups, riskOf, sessionsOf,
  type Adherence, type Ctx, type Risk,
} from "@/lib/selectors";
import { assignSignup, sendReminders } from "@/lib/store";
import { Bars } from "./Charts";
import { Empty, Initials, Panel, Stat, toast } from "./ui";

type Row = {
  m: Member;
  sessions: Session[];
  inside: boolean;
  last: number | null;
  since: number | null;
  adh: Adherence;
  risk: Risk;
  renewIn: number;
  value: number;
};

type Tab = "overview" | "members";
type Filter = "all" | "inside" | "risk" | "renewing" | "new";

const TIERS = Object.keys(PLAN_PRICES) as PlanTier[];
const FIRST_HOUR = 5;
const LAST_HOUR = 22;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const hour12 = (h: number) => `${h % 12 || 12} ${h < 12 ? "am" : "pm"}`;
const trainerName = (id: string) => TRAINERS.find((t) => t.id === id)?.name ?? "Unassigned";
const trainerShort = (id: string) => TRAINERS.find((t) => t.id === id)?.short ?? "Unassigned";

function reminderBody(r: Row): string {
  const first = r.m.name.split(" ")[0];
  const coach = trainerName(r.m.trainerId);
  if (r.since === null) {
    return `Hi ${first}, you joined ${BRAND.name} ${plural(r.m.joinedDaysAgo, "day")} ago and have not checked in yet. Come in this week and ${coach} will set you up with a first session.`;
  }
  return `Hi ${first}, we have not seen you at ${BRAND.name} for ${plural(r.since, "day")}. Your plan is waiting. Come in this week and ${coach} will pick up where you left off.`;
}

function renewalText(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

function AdhBar({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-ink-3">–</span>;
  const tone = pct >= 75 ? "bg-green" : pct >= 50 ? "bg-yellow-deep" : "bg-red";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 w-16 border border-line-strong bg-panel-2" aria-hidden>
        <div className={`h-full ${tone}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="mono text-[13px]">{pct}%</span>
    </div>
  );
}

function RiskTag({ risk }: { risk: Risk }) {
  if (risk === "risk") return <span className="tag tag-red">At risk</span>;
  if (risk === "watch") return <span className="tag tag-yellow">Watch</span>;
  if (risk === "new") return <span className="tag tag-blue">New</span>;
  return <span className="tag tag-green">On track</span>;
}

export default function OwnerDashboard({ ctx }: { ctx: Ctx }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [picks, setPicks] = useState<Record<string, string>>({});

  const today = startOfDay(ctx.now);
  const reminded = ctx.store.reminders;

  const data = useMemo(() => {
    const rows: Row[] = allMembers(ctx).map((m) => {
      const sessions = sessionsOf(ctx, m);
      const last = sessions.length ? sessions[sessions.length - 1].checkIn : null;
      return {
        m,
        sessions,
        inside: !!openSession(sessions),
        last,
        since: daysSinceLastVisit(ctx, sessions),
        adh: adherence(ctx, m, sessions, 28),
        risk: riskOf(ctx, m, sessions),
        renewIn: daysToRenewal(ctx, m),
        value: monthlyValue(m),
      };
    });

    const all = rows.flatMap((r) => r.sessions);
    const perDay = new Map<string, number>();
    for (const s of all) {
      const k = dayKey(s.checkIn);
      perDay.set(k, (perDay.get(k) ?? 0) + 1);
    }
    const todayKey = dayKey(today);
    const checkInsToday = perDay.get(todayKey) ?? 0;
    const lastWeekNow = addDays(ctx.now, -7);
    const lastWeekKey = dayKey(lastWeekNow);
    const lastWeekSame = all.filter((s) => dayKey(s.checkIn) === lastWeekKey && s.checkIn <= lastWeekNow).length;

    const hourly = hourlyCheckIns(all, today, FIRST_HOUR, LAST_HOUR);
    const nowHour = new Date(ctx.now).getHours();
    const peakVal = Math.max(0, ...hourly);
    const peakIdx = peakVal > 0 ? hourly.indexOf(peakVal) : -1;

    const days14 = Array.from({ length: 14 }, (_, i) => {
      const d = addDays(today, -(13 - i));
      return { d, n: perDay.get(dayKey(d)) ?? 0 };
    });

    const sums = new Array(7).fill(0);
    const seen = new Array(7).fill(0);
    for (let i = 1; i <= 56; i++) {
      const d = addDays(today, -i);
      const w = new Date(d).getDay();
      sums[w] += perDay.get(dayKey(d)) ?? 0;
      seen[w]++;
    }
    const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];
    const avgByWeekday = weekdayOrder.map((w) => (seen[w] ? sums[w] / seen[w] : 0));

    const mrr = rows.reduce((a, r) => a + r.value, 0);
    const tiers = TIERS.map((t) => {
      const inTier = rows.filter((r) => r.m.tier === t);
      const rev = inTier.reduce((a, r) => a + r.value, 0);
      return { tier: t, count: inTier.length, rev, share: mrr ? rev / mrr : 0 };
    });

    const mondayOffset = (new Date(today).getDay() + 6) % 7;
    const monday = addDays(today, -mondayOffset);
    const trainers = TRAINERS.map((t) => {
      const mine = rows.filter((r) => r.m.trainerId === t.id);
      const withPlan = mine.filter((r) => r.adh.pct !== null);
      return {
        t,
        clients: mine.length,
        avg: withPlan.length ? Math.round(withPlan.reduce((a, r) => a + (r.adh.pct ?? 0), 0) / withPlan.length) : null,
        visits: mine.reduce((a, r) => a + r.sessions.filter((s) => s.checkIn >= monday).length, 0),
        atRisk: mine.filter((r) => r.risk === "risk").length,
        rev: mine.reduce((a, r) => a + r.value, 0),
      };
    });

    const winback = rows
      .filter((r) => r.risk === "risk")
      .sort((a, b) => (b.since ?? 9999) - (a.since ?? 9999));
    const renewals = rows.filter((r) => r.renewIn <= 14).sort((a, b) => a.renewIn - b.renewIn);
    const insideRows = rows.filter((r) => r.inside);

    return {
      rows, checkInsToday, lastWeekSame, hourly, nowHour, peakVal, peakIdx, days14, avgByWeekday,
      mrr, tiers, trainers, winback, renewals, insideRows,
      joined30: rows.filter((r) => r.m.joinedDaysAgo <= 30).length,
      atRiskCount: rows.filter((r) => r.risk === "risk").length,
    };
  }, [ctx, today]);

  const weekday = WEEKDAYS_LONG[new Date(ctx.now).getDay()];
  const diff = data.checkInsToday - data.lastWeekSame;
  const checkInSub =
    diff === 0
      ? `Same as this time last ${weekday} (${data.lastWeekSame})`
      : `${diff > 0 ? "+" : "-"}${Math.abs(diff)} vs this time last ${weekday} (${data.lastWeekSame})`;

  const insideNames = data.insideRows.map((r) => r.m.name);
  const insideSub =
    insideNames.length === 0
      ? "Nobody is checked in right now"
      : insideNames.length <= 2
        ? insideNames.join(" and ")
        : `${insideNames.slice(0, 2).join(", ")} and ${insideNames.length - 2} more`;

  const unsent = data.winback.filter((r) => !reminded.includes(r.m.id));
  const signups = pendingSignups(ctx);
  const expected = data.renewals.reduce((a, r) => a + PLAN_PRICES[r.m.tier].price, 0);

  function remind(r: Row) {
    sendReminders([r.m.id], "Owner", reminderBody(r));
    toast(`Reminder sent to ${r.m.name}.`);
  }

  function remindAll() {
    const n = unsent.length;
    for (const r of unsent) sendReminders([r.m.id], "Owner", reminderBody(r));
    toast(`Reminder sent to ${plural(n, "member")}.`);
  }

  function assign(id: string, name: string) {
    const trainerId = picks[id];
    if (!trainerId) return;
    assignSignup(id, trainerId);
    setPicks((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });
    toast(`${name} assigned to ${trainerName(trainerId)}. They now appear in that trainer's client list.`);
  }

  // members tab
  const counts = {
    all: data.rows.length,
    inside: data.rows.filter((r) => r.inside).length,
    risk: data.atRiskCount,
    renewing: data.rows.filter((r) => r.renewIn <= 14).length,
    new: data.rows.filter((r) => r.m.joinedDaysAgo <= 7).length,
  };
  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: `All (${counts.all})` },
    { id: "inside", label: `Inside now (${counts.inside})` },
    { id: "risk", label: `At risk (${counts.risk})` },
    { id: "renewing", label: `Renewing in 14 days (${counts.renewing})` },
    { id: "new", label: `New (${counts.new})` },
  ];
  const q = query.trim().toLowerCase();
  const shown = data.rows
    .filter((r) => {
      if (filter === "inside" && !r.inside) return false;
      if (filter === "risk" && r.risk !== "risk") return false;
      if (filter === "renewing" && r.renewIn > 14) return false;
      if (filter === "new" && r.m.joinedDaysAgo > 7) return false;
      return !q || r.m.name.toLowerCase().includes(q);
    })
    .sort((a, b) => a.m.name.localeCompare(b.m.name));

  const hourLabels = data.hourly.map((_, i) => String(FIRST_HOUR + i));
  const nowIdx = data.nowHour >= FIRST_HOUR && data.nowHour <= LAST_HOUR ? data.nowHour - FIRST_HOUR : undefined;
  const peakHour = data.peakIdx >= 0 ? FIRST_HOUR + data.peakIdx : null;

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="kicker">Owner · {BRAND.name}</div>
          <h1 className="display mt-1 text-[clamp(34px,6vw,56px)]">{fmtDayLong(ctx.now)}</h1>
        </div>
        <span className={`tag ${data.insideRows.length ? "tag-green" : "tag-ink"}`}>
          {data.insideRows.length > 0 && <span className="live-dot" />}
          {data.insideRows.length} inside now
        </span>
      </header>

      <div className="tabs" role="tablist" aria-label="Owner views">
        {(["overview", "members"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            id={`owner-tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`owner-panel-${t}`}
            className="tab"
            onClick={() => setTab(t)}
          >
            {t === "overview" ? "Overview" : `Members (${data.rows.length})`}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div id="owner-panel-overview" role="tabpanel" aria-labelledby="owner-tab-overview" className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="lg:order-none [&>*]:h-full">
              <Stat label="Active members" value={data.rows.length} sub={`${plural(data.joined30, "member")} joined in the last 30 days`} />
            </div>
            <div className="lg:order-none [&>*]:h-full">
              <Stat label="Check-ins today" value={data.checkInsToday} sub={checkInSub} />
            </div>
            <div className="lg:order-none [&>*]:h-full">
              <Stat label="Inside now" value={data.insideRows.length} tone={data.insideRows.length ? "green" : "ink"} sub={insideSub} />
            </div>
            <div className="order-5 col-span-2 lg:order-none lg:col-span-1 [&>*]:h-full">
              <Stat
                label="Monthly recurring revenue"
                value={fmtINR(data.mrr)}
                sub={`${fmtINR(data.mrr * 12)} a year at the current mix`}
              />
            </div>
            <div className="order-4 lg:order-none [&>*]:h-full">
              <Stat label="At risk" value={data.atRiskCount} tone={data.atRiskCount ? "red" : "ink"} sub="No visit in 10+ days, or never came in" />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <Panel
              className="lg:col-span-7"
              kicker="Check-ins by hour, 24 h clock"
              title="Footfall today"
              right={<span className="tag tag-ink">{plural(data.checkInsToday, "check-in")} so far</span>}
            >
              <Bars
                values={data.hourly}
                labels={hourLabels}
                highlight={nowIdx}
                height={150}
                label="Check-ins per hour today"
              />
              <p className="muted mt-3 text-[14px]">
                {peakHour === null
                  ? "No check-ins yet today."
                  : `Peak so far: ${hour12(peakHour)} with ${plural(data.peakVal, "check-in")}. The yellow bar is the current hour.`}
              </p>
            </Panel>

            <Panel className="lg:col-span-5" kicker="Share of monthly revenue" title="Plan mix">
              <div className="grid gap-4">
                {data.tiers.map((t) => (
                  <div key={t.tier}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold">
                        {t.tier} <span className="mono text-[12px] text-ink-3">{fmtINR(PLAN_PRICES[t.tier].price)}</span>
                      </span>
                      <span className="mono text-[13px] text-ink-2">
                        {plural(t.count, "member")} · {Math.round(t.share * 100)}% of revenue
                      </span>
                    </div>
                    <div className="mt-1.5 h-3 border border-line-strong bg-panel-2" aria-hidden>
                      <div className="h-full bg-ink" style={{ width: `${Math.round(t.share * 100)}%` }} />
                    </div>
                    <div className="mono mt-1 text-[12px] text-ink-3">{fmtINR(t.rev)} a month</div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              className="lg:col-span-7"
              kicker="Check-ins per day"
              title="Last 14 days"
              right={<span className="tag tag-ink">Today is partial</span>}
            >
              <Bars
                values={data.days14.map((d) => d.n)}
                labels={data.days14.map((d) => "SMTWTFS"[new Date(d.d).getDay()])}
                highlight={13}
                height={150}
                showValues
                label="Check-ins per day for the last 14 days"
              />
              <p className="muted mt-3 text-[14px]">
                {fmtDayShort(data.days14[0].d)} to {fmtDayShort(data.days14[13].d)}.
              </p>
            </Panel>

            <Panel className="lg:col-span-5" kicker="Average over the last 8 weeks" title="Busiest days">
              <Bars
                values={data.avgByWeekday.map((v) => Math.round(v))}
                labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
                highlight={data.avgByWeekday.indexOf(Math.max(...data.avgByWeekday))}
                height={150}
                showValues
                label="Average check-ins by weekday"
              />
              <p className="muted mt-3 text-[14px]">
                Today is left out so the average is not pulled down by a half day.
              </p>
            </Panel>
          </div>

          <Panel kicker="This week and last 28 days" title="Trainers" flush>
            <div className="table-wrap">
              <table className="log-table min-w-[620px]">
                <thead>
                  <tr>
                    <th>Trainer</th>
                    <th>Clients</th>
                    <th>Avg adherence</th>
                    <th>Visits this week</th>
                    <th>At risk</th>
                    <th>Revenue / month</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trainers.map((r) => (
                    <tr key={r.t.id}>
                      <td>
                        <span className="flex items-center gap-2.5">
                          <Initials name={r.t.name} size={30} />
                          <span className="font-semibold">{r.t.name}</span>
                        </span>
                      </td>
                      <td className="mono">{r.clients}</td>
                      <td><AdhBar pct={r.avg} /></td>
                      <td className="mono">{r.visits}</td>
                      <td className={`mono ${r.atRisk ? "font-semibold text-red" : ""}`}>{r.atRisk}</td>
                      <td className="mono">{fmtINR(r.rev)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-12">
            <Panel
              className="lg:col-span-7"
              kicker="No visit in 10 or more days"
              title="Win-back list"
              right={
                data.winback.length > 0 ? (
                  <button className="btn btn-sm btn-primary" onClick={remindAll} disabled={unsent.length === 0}>
                    {unsent.length === 0 ? "All reminded" : `Remind all (${unsent.length})`}
                  </button>
                ) : undefined
              }
              flush
            >
              {data.winback.length === 0 ? (
                <div className="p-5">
                  <Empty title="Nobody has gone quiet" body="Every member has visited in the last 10 days." />
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="log-table min-w-[540px]">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Trainer</th>
                        <th>Away</th>
                        <th>Plan</th>
                        <th><span className="sr-only">Action</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.winback.map((r) => {
                        const sent = reminded.includes(r.m.id);
                        return (
                          <tr key={r.m.id}>
                            <td>
                              <Link href={`/clients/${r.m.id}?from=owner`} className="font-semibold underline decoration-line-strong underline-offset-2 hover:decoration-ink">
                                {r.m.name}
                              </Link>
                            </td>
                            <td className="muted">{trainerShort(r.m.trainerId)}</td>
                            <td className="mono">{r.since === null ? "Never visited" : plural(r.since, "day")}</td>
                            <td>{r.m.tier}</td>
                            <td>
                              <button
                                className="btn btn-sm"
                                disabled={sent}
                                onClick={() => remind(r)}
                                aria-label={sent ? `Reminder already sent to ${r.m.name}` : `Send reminder to ${r.m.name}`}
                              >
                                {sent ? "Sent" : "Send reminder"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel
              className="lg:col-span-5"
              kicker="Next 14 days"
              title="Renewals"
              right={<span className="tag tag-yellow">{fmtINR(expected)} expected</span>}
              flush
            >
              {data.renewals.length === 0 ? (
                <div className="p-5">
                  <Empty title="No renewals due" body="No membership comes up for renewal in the next 14 days." />
                </div>
              ) : (
                <ul className="m-0 max-h-[420px] list-none overflow-y-auto p-0">
                  {data.renewals.map((r) => (
                    <li key={r.m.id} className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 last:border-b-0">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{r.m.name}</div>
                        <div className="mono text-[12px] text-ink-3">
                          {r.m.tier} · {renewalText(r.renewIn)} · {fmtDayShort(addDays(today, r.renewIn))}
                        </div>
                      </div>
                      <div className="mono shrink-0 font-medium">{fmtINR(PLAN_PRICES[r.m.tier].price)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel
            kicker="Paid, not yet with a trainer"
            title="New sign-ups waiting"
            right={signups.length > 0 ? <span className="tag tag-blue">{signups.length} waiting</span> : undefined}
          >
            {signups.length === 0 ? (
              <Empty title="No sign-ups waiting" body="Every new member already has a trainer." />
            ) : (
              <div className="grid gap-3">
                {signups.map((s) => (
                  <div key={s.id} className="panel-flat grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="flex items-center gap-3">
                      <Initials name={s.name} />
                      <div className="min-w-0">
                        <div className="font-semibold">{s.name}</div>
                        <div className="mono text-[12px] text-ink-3">
                          {s.tier} · {fmtINR(PLAN_PRICES[s.tier].price)} ·{" "}
                          {s.daysAgo === 0 ? "joined today" : `joined ${plural(s.daysAgo, "day")} ago`}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label htmlFor={`trainer-${s.id}`} className="sr-only">
                        Trainer for {s.name}
                      </label>
                      <select
                        id={`trainer-${s.id}`}
                        className="input !w-auto min-w-[200px]"
                        value={picks[s.id] ?? ""}
                        onChange={(e) => setPicks((p) => ({ ...p, [s.id]: e.target.value }))}
                      >
                        <option value="">Choose trainer</option>
                        {TRAINERS.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <button className="btn btn-primary" disabled={!picks[s.id]} onClick={() => assign(s.id, s.name)}>
                        Assign
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {tab === "members" && (
        <div id="owner-panel-members" role="tabpanel" aria-labelledby="owner-tab-members" className="grid gap-4">
          <div className="grid gap-3">
            <div className="max-w-md">
              <label htmlFor="member-search" className="field-label">Search members</label>
              <input
                id="member-search"
                className="input"
                type="search"
                placeholder="Type a name"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter members">
              {filters.map((f) => (
                <button key={f.id} className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <Panel flush>
            {shown.length === 0 ? (
              <div className="p-5">
                <Empty
                  title="No members match"
                  body="Try a different name or clear the filter."
                  action={
                    <button className="btn" onClick={() => { setQuery(""); setFilter("all"); }}>
                      Clear filters
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="table-wrap">
                <table className="log-table min-w-[900px]">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Trainer</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Last visit</th>
                      <th>28-day adherence</th>
                      <th>Renews in</th>
                      <th>Risk</th>
                      <th><span className="sr-only">Open</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((r) => (
                      <tr key={r.m.id}>
                        <td>
                          <span className="flex items-center gap-2.5">
                            <Initials name={r.m.name} size={30} />
                            <span className="font-semibold">{r.m.name}</span>
                          </span>
                        </td>
                        <td className="muted">{trainerShort(r.m.trainerId)}</td>
                        <td>{r.m.tier}</td>
                        <td>
                          {r.inside ? (
                            <span className="tag tag-green"><span className="live-dot" /> Inside</span>
                          ) : (
                            <span className="tag tag-ink">Away</span>
                          )}
                        </td>
                        <td className="mono text-[13px]">{r.last ? fmtAgo(r.last, ctx.now) : "Never"}</td>
                        <td><AdhBar pct={r.adh.pct} /></td>
                        <td className="mono text-[13px]">{r.renewIn === 0 ? "Today" : `${r.renewIn} d`}</td>
                        <td><RiskTag risk={r.risk} /></td>
                        <td>
                          <Link href={`/clients/${r.m.id}?from=owner`} className="btn btn-sm" aria-label={`Open ${r.m.name}`}>
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
          <p className="mono text-[12px] text-ink-3" aria-live="polite">
            Showing {shown.length} of {data.rows.length} members
          </p>
        </div>
      )}
    </div>
  );
}
