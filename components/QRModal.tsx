"use client";
import { useMemo } from "react";
import { generateQrPattern } from "@/lib/qr";

export default function QRModal({ onClose, onScan }: { onClose: () => void; onScan: () => void }) {
  const cells = useMemo(() => generateQrPattern(), []);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,6,8,0.72)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] overflow-y-auto rounded-[18px] p-7"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="eyebrow">Scan at the door</div>
            <h2 className="mt-1 font-display text-[22px]">Your check-in code</h2>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div
          className="mx-auto grid h-[220px] w-[220px] place-items-center rounded-[12px] p-3"
          style={{ background: "#fff" }}
        >
          <div className="grid h-full w-full grid-cols-[repeat(21,1fr)]">
            {cells.map((on, i) => (
              <i
                key={i}
                className="rounded-[1px]"
                style={{ background: on ? "#0a0b0d" : "transparent", display: "block" }}
              />
            ))}
          </div>
        </div>
        <p className="muted mt-4 text-center text-[13px]">
          Point the camera at the gym tablet. Code refreshes every 2 min.
        </p>
        <button className="btn btn-primary btn-full mt-3.5" onClick={onScan}>
          Simulate scan (demo)
        </button>
      </div>
    </div>
  );
}
