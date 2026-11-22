"use client";
import type { NutritionPlan } from "@/lib/types";
import { Panel } from "./ui";

export default function NutritionView({ plan }: { plan: NutritionPlan }) {
  const pk = plan.protein * 4;
  const ck = plan.carbs * 4;
  const fk = plan.fat * 9;
  const total = Math.max(1, pk + ck + fk);
  const pct = (v: number) => Math.round((v / total) * 100);

  const macros = [
    { label: "Protein", g: plan.protein, kcal: pk, color: "bg-green" },
    { label: "Carbs", g: plan.carbs, kcal: ck, color: "bg-yellow" },
    { label: "Fat", g: plan.fat, kcal: fk, color: "bg-blue" },
  ];

  return (
    <div className="grid gap-4">
      <section className="panel-ink border-t-[6px] !border-t-yellow p-5 sm:p-6">
        <div className="kicker">Daily target</div>
        <h2 className="display mt-1 text-[clamp(26px,4vw,34px)]">{plan.title}</h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-[auto_1fr] sm:items-end">
          <div>
            <div className="num text-[clamp(64px,12vw,96px)] text-yellow">{plan.kcal.toLocaleString("en-IN")}</div>
            <div className="kicker mt-1">kcal per day</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {macros.map((m) => (
              <div key={m.label}>
                <div className="num text-[clamp(32px,6vw,48px)]">{m.g}<span className="text-[20px]"> g</span></div>
                <div className="kicker mt-1 flex items-center gap-1.5">
                  <span className={`inline-block h-2.5 w-2.5 ${m.color}`} aria-hidden /> {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex h-4 border border-white" role="img" aria-label={`Calories from protein ${pct(pk)} percent, carbs ${pct(ck)} percent, fat ${pct(fk)} percent`}>
          {macros.map((m) => (
            <div key={m.label} className={m.color} style={{ width: `${(m.kcal / total) * 100}%` }} />
          ))}
        </div>
        <div className="mono mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-[#c9ccd3]">
          {macros.map((m) => (
            <span key={m.label}>{m.label} {pct(m.kcal)}% of calories</span>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: "Resting burn (BMR)", v: `${plan.bmr.toLocaleString("en-IN")} kcal` },
          { k: "Daily burn (TDEE)", v: `${plan.tdee.toLocaleString("en-IN")} kcal` },
          { k: "Water", v: `${plan.waterL} L` },
          { k: "Fibre", v: `${plan.fiber} g` },
        ].map((s) => (
          <div key={s.k} className="panel-flat px-3 py-2.5">
            <div className="kicker">{s.k}</div>
            <div className="mono mt-0.5 text-[18px] font-medium">{s.v}</div>
          </div>
        ))}
      </div>

      {plan.meals.map((m, i) => (
        <Panel
          key={`${m.slot}-${i}`}
          flush
          kicker={m.time}
          title={m.slot}
          right={
            <span className="mono text-[13px] text-ink-2">
              {m.kcal} kcal · P {m.protein} g · C {m.carbs} g · F {m.fat} g
            </span>
          }
        >
          <div className="table-wrap">
            <table className="log-table min-w-[420px]">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Quantity</th>
                  <th className="text-right">kcal</th>
                  <th className="text-right">Protein</th>
                </tr>
              </thead>
              <tbody>
                {m.items.map((it, k) => (
                  <tr key={k}>
                    <td className="font-semibold">{it.name}</td>
                    <td className="mono whitespace-nowrap">{it.qty}</td>
                    <td className="mono text-right">{it.kcal}</td>
                    <td className="mono text-right">{it.protein} g</td>
                  </tr>
                ))}
                <tr>
                  <td className="border-t-2 border-ink font-bold" colSpan={2}>Meal total</td>
                  <td className="mono border-t-2 border-ink text-right font-bold">{m.kcal}</td>
                  <td className="mono border-t-2 border-ink text-right font-bold">{m.protein} g</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      ))}

      <Panel kicker="How to use this" title="Notes">
        <ul className="grid gap-2.5">
          {plan.notes.map((n, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-[9px] h-2 w-2 shrink-0 bg-ink" aria-hidden />
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
