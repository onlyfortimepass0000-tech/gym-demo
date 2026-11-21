import type { NutritionRecord } from "@/lib/types";
import NutritionIntakeButton from "./NutritionIntakeButton";

export default function NutritionCard({ record }: { record: NutritionRecord | null }) {
  if (!record) {
    return (
      <div
        className="card h-full"
        style={{ background: "linear-gradient(145deg, var(--surface) 0%, var(--surface-2) 100%)" }}
      >
        <div className="eyebrow">Nutrition plan</div>
        <h3 className="mt-1.5 font-display text-xl font-semibold">Get a plan in 60 seconds.</h3>
        <p className="muted mt-2.5 mb-4">
          Five quick questions. We&apos;ll build macros and a meal outline that matches your goal and diet.
        </p>
        <NutritionIntakeButton label="Start intake" primary />
      </div>
    );
  }

  const { plan } = record;
  return (
    <div className="card h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Nutrition plan</div>
          <h3 className="mt-1 font-display text-lg font-semibold">{plan.title}</h3>
        </div>
        <NutritionIntakeButton label="Redo" />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <MacroRing kcal={plan.kcal} macros={plan.macros} />
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <Row color="var(--accent)" label="Protein" value={`${plan.macros.p}g`} />
          <Row color="var(--warm)" label="Carbs" value={`${plan.macros.c}g`} />
          <Row color="var(--good)" label="Fats" value={`${plan.macros.f}g`} />
        </div>
      </div>
      <div className="divider" />
      <div className="eyebrow mb-2.5">Meal outline</div>
      <div className="flex flex-col gap-2.5">
        {plan.meals.map((m) => (
          <div
            key={m.name}
            className="rounded-[12px] p-3.5"
            style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-body text-[14px] font-semibold">{m.name}</h4>
              <span className="tabular text-xs" style={{ color: "var(--fg-3)" }}>
                {m.kcal} kcal
              </span>
            </div>
            <div className="muted mt-1 text-[13px]">{m.items}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="k flex items-center gap-1.5">
        <span className="dot" style={{ color }} />
        {label}
      </span>
      <span className="tabular font-semibold">{value}</span>
    </div>
  );
}

function MacroRing({
  kcal,
  macros,
}: {
  kcal: number;
  macros: { p: number; c: number; f: number };
}) {
  const total = macros.p * 4 + macros.c * 4 + macros.f * 9 || 1;
  const pp = (macros.p * 4) / total;
  const pc = (macros.c * 4) / total;
  const pf = (macros.f * 9) / total;
  const C = 2 * Math.PI * 46;
  let o = 0;
  const seg = (color: string, frac: number) => {
    const len = frac * C;
    const el = (
      <circle
        key={color}
        cx={54}
        cy={54}
        r={46}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeDasharray={`${len} ${C - len}`}
        strokeDashoffset={-o}
      />
    );
    o += len;
    return el;
  };
  return (
    <div className="relative h-[108px] w-[108px] flex-shrink-0">
      <svg viewBox="0 0 108 108" className="h-full w-full" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={54} cy={54} r={46} fill="none" stroke="var(--surface-2)" strokeWidth={12} />
        {seg("var(--accent)", pp)}
        {seg("var(--warm)", pc)}
        {seg("var(--good)", pf)}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div className="leading-none">
          <div className="font-display text-[22px] font-semibold tabular">{kcal}</div>
          <div className="faint mt-1 text-[11px]">kcal / day</div>
        </div>
      </div>
    </div>
  );
}
