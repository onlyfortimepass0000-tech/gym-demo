"use client";

export function Bars({
  values,
  labels,
  highlight,
  height = 140,
  showValues = false,
  unit = "",
  label,
}: {
  values: number[];
  labels: string[];
  highlight?: number;
  height?: number;
  showValues?: boolean;
  unit?: string;
  label: string;
}) {
  const max = Math.max(1, ...values);
  return (
    <figure role="img" aria-label={label} className="m-0">
      <div className="flex items-end gap-[3px] border-b-2 border-ink" style={{ height }}>
        {values.map((v, i) => (
          <div key={i} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${labels[i]}: ${v}${unit}`}>
            {showValues && v > 0 && <span className="mono mb-0.5 text-center text-[10px] text-ink-2">{v}</span>}
            <div
              style={{
                height: `${(v / max) * (showValues ? 82 : 100)}%`,
                minHeight: v > 0 ? 3 : 0,
                background: i === highlight ? "var(--yellow)" : "var(--ink)",
                outline: i === highlight ? "2px solid var(--ink)" : undefined,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-[3px]">
        {labels.map((l, i) => (
          <span key={i} className="mono min-w-0 flex-1 truncate text-center text-[10px] text-ink-3">{l}</span>
        ))}
      </div>
    </figure>
  );
}

export function LineChart({
  points,
  height = 180,
  unit = "",
  label,
}: {
  points: { x: number; y: number; label: string }[];
  height?: number;
  unit?: string;
  label: string;
}) {
  if (points.length < 2) {
    return <div className="muted text-[14px]">Log at least two weigh-ins to see a trend.</div>;
  }
  const W = 600;
  const H = height;
  const padL = 40, padR = 16, padT = 14, padB = 26;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const rawMin = Math.min(...ys), rawMax = Math.max(...ys);
  const span = Math.max(1, rawMax - rawMin);
  const minY = Math.floor((rawMin - span * 0.25) * 2) / 2;
  const maxY = Math.ceil((rawMax + span * 0.25) * 2) / 2;
  const sx = (x: number) => padL + ((x - minX) / Math.max(1, maxX - minX)) * (W - padL - padR);
  const sy = (y: number) => padT + (1 - (y - minY) / Math.max(0.0001, maxY - minY)) * (H - padT - padB);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
  const ticks = [minY, (minY + maxY) / 2, maxY];
  const last = points[points.length - 1];
  const first = points[0];

  return (
    <figure role="img" aria-label={label} className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" preserveAspectRatio="xMidYMid meet">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={sy(t)} y2={sy(t)} stroke="var(--line)" strokeWidth="1" />
            <text x={padL - 6} y={sy(t) + 4} textAnchor="end" fontSize="11" fill="var(--ink-3)" fontFamily="var(--font-mono)">
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={i === points.length - 1 ? 6 : 3} fill={i === points.length - 1 ? "var(--yellow)" : "var(--ink)"} stroke="var(--ink)" strokeWidth="2" />
        ))}
        <text x={sx(first.x)} y={H - 6} textAnchor="start" fontSize="11" fill="var(--ink-3)" fontFamily="var(--font-mono)">{first.label}</text>
        <text x={sx(last.x)} y={H - 6} textAnchor="end" fontSize="11" fill="var(--ink-3)" fontFamily="var(--font-mono)">{last.label}</text>
        <text x={sx(last.x)} y={sy(last.y) - 12} textAnchor="end" fontSize="13" fontWeight="600" fill="var(--ink)" fontFamily="var(--font-mono)">
          {last.y.toFixed(1)}{unit}
        </text>
      </svg>
    </figure>
  );
}
