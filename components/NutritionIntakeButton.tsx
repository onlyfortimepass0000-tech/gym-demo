"use client";
import { useState } from "react";
import NutritionIntake from "./NutritionIntake";

export default function NutritionIntakeButton({
  label,
  primary,
}: {
  label: string;
  primary?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={primary ? "btn btn-primary" : "btn btn-sm btn-ghost"}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      {open && <NutritionIntake onClose={() => setOpen(false)} />}
    </>
  );
}
