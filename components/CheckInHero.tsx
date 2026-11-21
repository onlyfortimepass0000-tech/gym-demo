"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import QRModal from "./QRModal";

export default function CheckInHero({
  name,
  checkedIn,
  checkInTime,
  streak,
}: {
  name: string;
  checkedIn: boolean;
  checkInTime: number | null;
  streak: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showQR, setShowQR] = useState(false);

  async function post(url: string) {
    setBusy(true);
    try {
      await fetch(url, { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const bg = checkedIn
    ? "radial-gradient(circle at 20% 0%, rgba(88,214,141,0.22), transparent 55%), linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)"
    : "radial-gradient(circle at 20% 0%, rgba(212,255,61,0.18), transparent 55%), linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)";

  return (
    <>
      <div
        className="rounded-[18px] p-7"
        style={{ background: bg, border: "1px solid var(--line)" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="eyebrow">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
            <h1 className="mt-1.5 font-display text-[clamp(28px,4vw,38px)] font-semibold leading-[1.1] tracking-tight">
              Welcome back, {name}.
            </h1>
            <p className="muted mt-1">
              {checkedIn
                ? `Checked in at ${fmtTime(checkInTime)}. Session running.`
                : "Tap below to check in. The front desk sees it instantly."}
            </p>
          </div>
          <div className={`pill ${streak >= 7 ? "pill-accent" : ""}`}>
            🔥 <span className="tabular">{streak}</span>-day streak
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {checkedIn ? (
            <>
              <button className="btn btn-lg" disabled={busy} onClick={() => post("/api/checkout")}>
                Check out
              </button>
              <div className="pill pill-good">
                <span className="dot" /> Inside the gym
              </div>
            </>
          ) : (
            <>
              <button
                className="btn btn-primary btn-lg"
                disabled={busy}
                onClick={() => post("/api/checkin")}
              >
                Check in
              </button>
              <button className="btn btn-lg" onClick={() => setShowQR(true)}>
                Scan QR at door
              </button>
            </>
          )}
        </div>
      </div>
      {showQR && (
        <QRModal
          onClose={() => setShowQR(false)}
          onScan={() => {
            setShowQR(false);
            post("/api/checkin");
          }}
        />
      )}
    </>
  );
}

function fmtTime(ts: number | null) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}
