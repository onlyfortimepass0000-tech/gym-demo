"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type Question = {
  k: string;
  q: string;
  type: "chips" | "input";
  options?: readonly string[];
  unit?: string;
  placeholder?: string;
};

export default function IntakeFlow({
  title,
  questions,
  endpoint,
  onClose,
}: {
  title: string;
  questions: readonly Question[];
  endpoint: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const q = questions[idx];
  const pct = (idx / questions.length) * 100;
  const last = idx === questions.length - 1;

  async function next() {
    if (!answers[q.k]) {
      setErr("Pick one to continue.");
      return;
    }
    setErr(null);
    if (!last) {
      setIdx(idx + 1);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      if (!res.ok) throw new Error("Save failed");
      onClose();
      router.refresh();
    } catch (e) {
      setErr("Could not save. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function back() {
    if (idx > 0) {
      setErr(null);
      setIdx(idx - 1);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,6,8,0.72)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] overflow-y-auto rounded-[18px] p-7"
        style={{ background: "var(--surface)", border: "1px solid var(--line)", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1.5 flex items-start justify-between gap-3">
          <div className="eyebrow">
            {title} · {idx + 1} of {questions.length}
          </div>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
        <div className="bar mb-6">
          <span style={{ width: `${pct}%` }} />
        </div>
        <h2 className="mb-4 font-display text-[22px] font-semibold">{q.q}</h2>
        {q.type === "chips" ? (
          <div className="flex flex-wrap gap-2">
            {q.options!.map((o) => (
              <button
                key={o}
                className={`chip ${answers[q.k] === o ? "chip-sel" : ""}`}
                onClick={() => setAnswers({ ...answers, [q.k]: o })}
              >
                {o}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              className="input"
              type="text"
              inputMode="numeric"
              placeholder={q.placeholder}
              value={answers[q.k] ?? ""}
              onChange={(e) => setAnswers({ ...answers, [q.k]: e.target.value })}
            />
            {q.unit && (
              <span className="muted font-mono" style={{ color: "var(--fg-2)" }}>
                {q.unit}
              </span>
            )}
          </div>
        )}
        {err && (
          <div className="mt-3 text-[13px]" style={{ color: "var(--danger)" }}>
            {err}
          </div>
        )}
        <div className="mt-6 flex items-center justify-between">
          <button
            className="btn btn-ghost"
            onClick={back}
            disabled={idx === 0}
            style={idx === 0 ? { opacity: 0.4, pointerEvents: "none" } : undefined}
          >
            ← Back
          </button>
          <button className="btn btn-primary" onClick={next} disabled={submitting}>
            {submitting ? "Saving…" : last ? "Build my plan" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
