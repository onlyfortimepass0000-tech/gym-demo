import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const HOUR_LABELS = ["6a", "", "8a", "", "10a", "", "12p", "", "2p", "", "4p", "", "6p", "", "8p", "", "10p", "", "", "", ""];
const DAY = 86400000;

function ownerStats() {
  const db = getDb();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayRows = db
    .prepare("SELECT check_in FROM sessions WHERE check_in >= ?")
    .all(startOfDay.getTime()) as { check_in: number }[];

  const baseline = [20, 28, 35, 42, 48, 38, 25, 18, 12, 22, 55, 72, 65, 45, 38, 42, 68, 94, 88, 62, 40];
  const hours = [...baseline];
  for (const r of todayRows) {
    const d = new Date(r.check_in);
    const h = d.getHours();
    const idx = h >= 6 ? h - 6 : h + 18;
    if (idx >= 0 && idx < hours.length) hours[idx] += 1;
  }
  const checkInsToday = hours.reduce((a, b) => a + b, 0);
  return { hours, checkInsToday };
}

export default function OwnerPage() {
  const { hours, checkInsToday } = ownerStats();
  const maxH = Math.max(...hours);
  const peakIdx = hours.indexOf(maxH);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <section className="lg:col-span-12">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="eyebrow">Owner · Kilo Thane</div>
            <h1 className="mt-1 font-display text-[clamp(26px,3.5vw,32px)] font-semibold tracking-tight">
              Today at a glance
            </h1>
          </div>
          <div className="flex gap-1.5">
            <button className="btn btn-sm">Today</button>
            <button className="btn btn-sm btn-ghost">This week</button>
            <button className="btn btn-sm btn-ghost">This month</button>
          </div>
        </div>
      </section>

      <Tile label="Active members" value="284" delta="+12 this month" tone="up" />
      <Tile label="Check-ins today" value={String(checkInsToday)} delta="+18% vs avg" tone="up" />
      <Tile label="MRR" value="₹4.8L" delta="+6.2%" tone="up" />
      <Tile label="Churn risk" value="14" delta="Needs outreach" tone="down" valueColor="var(--warm)" />

      <section className="lg:col-span-8">
        <div className="card">
          <div className="mb-3.5 flex items-start justify-between gap-3">
            <div>
              <div className="eyebrow">Foot traffic</div>
              <h3 className="mt-1 font-display text-lg font-semibold">Check-ins by hour · today</h3>
            </div>
            <span className="k">Peak: 6pm</span>
          </div>
          <div className="flex h-[140px] items-end gap-1.5">
            {hours.map((h, i) => (
              <div
                key={i}
                className="min-h-[4px] flex-1 rounded-[4px_4px_2px_2px]"
                style={{
                  height: `${(h / maxH) * 100}%`,
                  background:
                    i === peakIdx
                      ? "var(--warm)"
                      : "linear-gradient(180deg, var(--accent) 0%, rgba(212,255,61,0.35) 100%)",
                }}
              />
            ))}
          </div>
          <div className="mt-1.5 flex gap-1.5">
            {HOUR_LABELS.map((l, i) => (
              <span key={i} className="flex-1 text-center text-[10px]" style={{ color: "var(--fg-3)" }}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="lg:col-span-4">
        <div className="card h-full">
          <div className="eyebrow">Plan mix</div>
          <h3 className="mt-1 font-display text-lg font-semibold">Active memberships</h3>
          <div className="mt-4 flex flex-col gap-4">
            <PlanRow label="Monthly · ₹2,500" count="142" pct={50} />
            <PlanRow label="Quarterly · ₹6,500" count="84" pct={30} tone="warm" />
            <PlanRow label="Annual · ₹22,000" count="38" pct={13} tone="good" />
            <PlanRow label="PT add-on" count="20" pct={7} tone="muted" />
          </div>
        </div>
      </section>

      <section className="lg:col-span-6">
        <div className="card">
          <div className="eyebrow">Trainers</div>
          <h3 className="mt-1 font-display text-lg font-semibold">Performance this month</h3>
          <div className="mt-3.5 flex flex-col gap-2.5">
            {[
              { n: "Harish Barai", clients: 24, adh: 82, rev: 48000 },
              { n: "Saomik R.", clients: 18, adh: 76, rev: 36000 },
              { n: "Meera K.", clients: 21, adh: 88, rev: 42000 },
              { n: "Devansh T.", clients: 12, adh: 64, rev: 24000 },
            ].map((t) => (
              <div
                key={t.n}
                className="flex items-center gap-3 rounded-[10px] p-3"
                style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
              >
                <span
                  className="inline-grid h-8 w-8 place-items-center rounded-full text-xs font-semibold"
                  style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
                >
                  {t.n.split(" ").map((x) => x[0]).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{t.n}</div>
                  <div className="muted text-xs">
                    {t.clients} clients · {t.adh}% adherence
                  </div>
                </div>
                <div className="tabular font-semibold">₹{(t.rev / 1000).toFixed(0)}k</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lg:col-span-6">
        <div className="card">
          <div className="eyebrow">Needs attention</div>
          <h3 className="mt-1 font-display text-lg font-semibold">This week</h3>
          <div className="mt-3.5 flex flex-col gap-2.5">
            <AttentionItem
              icon="!"
              iconBg="rgba(255,92,92,0.14)"
              iconColor="var(--danger)"
              title="14 members haven't checked in for 10+ days"
              sub="High churn risk. One-tap WhatsApp campaign ready."
              cta="Send"
              primary
            />
            <AttentionItem
              icon="⏱"
              iconBg="rgba(255,138,61,0.14)"
              iconColor="var(--warm)"
              title="22 memberships renew in 7 days"
              sub="Projected renewal revenue: ₹1.2L."
              cta="Review"
            />
            <AttentionItem
              icon="★"
              iconBg="rgba(212,255,61,0.18)"
              iconColor="var(--accent)"
              title="8 new sign-ups awaiting onboarding"
              sub="Assign to a trainer to kick off their beginner plan."
              cta="Assign"
            />
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
    <section className="lg:col-span-3">
      <div className="tile">
        <div className="k">{label}</div>
        <div
          className="mt-2 font-display text-[32px] font-semibold tabular tracking-tight"
          style={valueColor ? { color: valueColor } : undefined}
        >
          {value}
        </div>
        <div className="mt-1 text-xs font-semibold" style={{ color: tone === "up" ? "var(--good)" : "var(--danger)" }}>
          {delta}
        </div>
      </div>
    </section>
  );
}

function PlanRow({
  label,
  count,
  pct,
  tone,
}: {
  label: string;
  count: string;
  pct: number;
  tone?: "warm" | "good" | "muted";
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="k">{label}</span>
        <span className="tabular font-semibold">{count}</span>
      </div>
      <div
        className={`bar mt-1.5 ${tone === "warm" ? "bar-warm" : tone === "good" ? "bar-good" : ""}`}
        style={tone === "muted" ? { background: "var(--surface-2)" } : undefined}
      >
        <span
          style={{
            width: `${pct}%`,
            ...(tone === "muted" ? { background: "var(--fg-2)" } : {}),
          }}
        />
      </div>
    </div>
  );
}

function AttentionItem({
  icon,
  iconBg,
  iconColor,
  title,
  sub,
  cta,
  primary,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  sub: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-[10px] p-3"
      style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
    >
      <div
        className="grid h-8 w-8 place-items-center rounded-[8px] font-bold"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{title}</div>
        <div className="muted text-xs">{sub}</div>
      </div>
      <button className={primary ? "btn btn-sm btn-primary" : "btn btn-sm"}>{cta}</button>
    </div>
  );
}
