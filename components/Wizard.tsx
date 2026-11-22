"use client";
import { useState, type ReactNode } from "react";
import { Modal } from "./ui";

export type WizardStep = {
  title: string;
  hint?: string;
  render: () => ReactNode;
  // Return a message to block Next and show it inline, or null to continue.
  validate?: () => string | null;
};

export default function Wizard({
  title,
  steps,
  finishLabel,
  onFinish,
  onClose,
}: {
  title: string;
  steps: WizardStep[];
  finishLabel: string;
  // Throwing here shows the message inside the wizard instead of failing silently.
  onFinish: () => void;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const step = steps[idx];
  const last = idx === steps.length - 1;

  function next() {
    const problem = step.validate?.() ?? null;
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    if (!last) {
      setIdx(idx + 1);
      return;
    }
    try {
      onFinish();
    } catch (e) {
      setError(e instanceof Error ? `Could not build the plan: ${e.message}` : "Could not build the plan. Try again.");
    }
  }

  function back() {
    setError(null);
    setIdx(Math.max(0, idx - 1));
  }

  return (
    <Modal title={title} kicker={`Question ${idx + 1} of ${steps.length}`} onClose={onClose} maxWidth={680}>
      <div className="mb-5 flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={idx + 1}>
        {steps.map((_, i) => (
          <span key={i} className={`h-2 flex-1 border border-ink ${i <= idx ? "bg-ink" : "bg-white"}`} />
        ))}
      </div>

      <h3 className="display text-[34px] leading-[1]">{step.title}</h3>
      {step.hint && <p className="muted mt-2 text-[14px]">{step.hint}</p>}

      <div className="mt-5">{step.render()}</div>

      {error && (
        <p role="alert" className="mt-4 border-2 border-red bg-red-bg px-3 py-2 text-[14px] font-semibold text-red">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        {idx > 0 ? (
          <button className="btn btn-ghost" onClick={back}>
            Back
          </button>
        ) : (
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        )}
        <button className="btn btn-primary" onClick={next}>
          {last ? finishLabel : "Next"}
        </button>
      </div>
    </Modal>
  );
}
