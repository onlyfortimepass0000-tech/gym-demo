"use client";
import { useEffect, useState, type ReactNode } from "react";

// ---------- toast ----------
const toastListeners = new Set<(m: string | null) => void>();
let toastTimer: number | undefined;

export function toast(message: string) {
  toastListeners.forEach((l) => l(message));
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastListeners.forEach((l) => l(null)), 3200);
}

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    toastListeners.add(setMsg);
    return () => {
      toastListeners.delete(setMsg);
    };
  }, []);
  if (!msg) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      {msg}
    </div>
  );
}

// ---------- modal ----------
export function Modal({
  title,
  kicker,
  onClose,
  children,
  maxWidth,
}: {
  title: string;
  kicker?: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} style={maxWidth ? { maxWidth } : undefined}>
        <div className="flex items-start justify-between gap-3 border-b-2 border-ink bg-ink px-5 py-3 text-white">
          <div>
            {kicker && <div className="kicker !text-[#9a9ea8]">{kicker}</div>}
            <div className="display text-[26px] text-yellow">{title}</div>
          </div>
          <button className="btn btn-sm !border-[#555a64] !bg-transparent !text-white !shadow-none" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ---------- small pieces ----------
export function PageSkeleton() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-40 border border-line" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="skeleton h-72 border border-line" />
        <div className="skeleton h-72 border border-line" />
      </div>
    </div>
  );
}

export function Panel({
  title,
  kicker,
  right,
  children,
  className = "",
  flush = false,
}: {
  title?: string;
  kicker?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || kicker || right) && (
        <header className="panel-head">
          <div>
            {kicker && <div className="kicker">{kicker}</div>}
            {title && <h2 className="panel-title">{title}</h2>}
          </div>
          {right}
        </header>
      )}
      <div className={flush ? "" : "panel-pad"}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "green" | "red" | "ink";
}) {
  const color = tone === "green" ? "text-green" : tone === "red" ? "text-red" : "text-ink";
  return (
    <div className="panel-flat p-4">
      <div className="kicker">{label}</div>
      <div className={`num mt-2 text-[44px] ${color}`}>{value}</div>
      {sub && <div className="mt-1.5 text-[13px] text-ink-2">{sub}</div>}
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="border-2 border-dashed border-line-strong p-6 text-center">
      <div className="display text-[22px]">{title}</div>
      <p className="muted mx-auto mt-2 max-w-md">{body}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Initials({ name, size = 36 }: { name: string; size?: number }) {
  const t = name
    .replace(/^Coach /, "")
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");
  return (
    <span
      className="inline-grid shrink-0 place-items-center border-2 border-ink bg-yellow font-display font-extrabold"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {t}
    </span>
  );
}
