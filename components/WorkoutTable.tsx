import type { Exercise } from "@/lib/types";

export default function WorkoutTable({ items }: { items: Exercise[] }) {
  return (
    <div>
      <div
        className="mb-1.5 hidden grid-cols-[1fr_70px_70px_80px] gap-2.5 px-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-3 sm:grid"
        style={{ color: "var(--fg-3)" }}
      >
        <div>Exercise</div>
        <div>Sets</div>
        <div>Reps</div>
        <div>Rest</div>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((e, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_auto] items-center gap-2.5 rounded-[10px] px-3.5 py-3 sm:grid-cols-[1fr_70px_70px_80px]"
            style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
          >
            <div className="font-medium">{e.name}</div>
            <ExCell label="Sets" value={String(e.sets)} />
            <ExCell label="Reps" value={e.reps} />
            <ExCell label="Rest" value={e.rest} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ExCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="justify-self-end sm:justify-self-auto">
      <div className="text-[11px] uppercase tracking-[0.08em] sm:block" style={{ color: "var(--fg-3)" }}>
        {label}
      </div>
      <div className="tabular font-semibold">{value}</div>
    </div>
  );
}
