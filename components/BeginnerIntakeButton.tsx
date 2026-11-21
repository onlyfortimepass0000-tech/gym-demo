"use client";
import { useState } from "react";
import BeginnerIntake from "./BeginnerIntake";

export default function BeginnerIntakeButton({
  label,
  primary,
  large,
}: {
  label: string;
  primary?: boolean;
  large?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const cls = `btn ${primary ? "btn-primary" : ""} ${large ? "btn-lg" : primary ? "" : "btn-sm"}`.trim();
  return (
    <>
      <button className={cls} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && <BeginnerIntake onClose={() => setOpen(false)} />}
    </>
  );
}
