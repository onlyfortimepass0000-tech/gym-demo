import type { AttendanceCell } from "@/lib/types";

const LEVELS = ["", "l1", "l2", "l3"] as const;

export default function Heatmap({ history }: { history: AttendanceCell[] }) {
  const todayIdx = history.length - 1;
  return (
    <>
      <div className="grid grid-cols-8 gap-[5px]">
        {history.map((cell, i) => (
          <div
            key={cell.date}
            title={`${new Date(cell.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })} · ${["rest", "light", "solid", "intense"][cell.intensity]}`}
            className="aspect-square rounded-[5px]"
            style={swatch(cell.intensity, i === todayIdx)}
          />
        ))}
      </div>
    </>
  );
}

function swatch(level: 0 | 1 | 2 | 3, today: boolean) {
  const base: React.CSSProperties =
    level === 0
      ? { background: "var(--surface-2)", border: "1px solid var(--line)" }
      : level === 1
      ? { background: "rgba(212,255,61,0.22)", border: "1px solid rgba(212,255,61,0.3)" }
      : level === 2
      ? { background: "rgba(212,255,61,0.55)", border: "1px solid rgba(212,255,61,0.6)" }
      : { background: "var(--accent)", border: "1px solid var(--accent)" };
  if (today) {
    base.outline = "2px solid var(--fg)";
    base.outlineOffset = "1px";
  }
  return base;
}

export function HeatmapLegend() {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-fg-3" style={{ color: "var(--fg-3)" }}>
      Less
      <span className="h-[11px] w-[11px] rounded-[3px]" style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }} />
      <span
        className="h-[11px] w-[11px] rounded-[3px]"
        style={{ background: "rgba(212,255,61,0.22)", border: "1px solid rgba(212,255,61,0.3)" }}
      />
      <span
        className="h-[11px] w-[11px] rounded-[3px]"
        style={{ background: "rgba(212,255,61,0.55)", border: "1px solid rgba(212,255,61,0.6)" }}
      />
      <span className="h-[11px] w-[11px] rounded-[3px]" style={{ background: "var(--accent)", border: "1px solid var(--accent)" }} />
      More
    </div>
  );
}
