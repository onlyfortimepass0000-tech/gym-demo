"use client";
import IntakeFlow from "./IntakeFlow";
import { BEGINNER_QUESTIONS } from "@/lib/beginner";

export default function BeginnerIntake({ onClose }: { onClose: () => void }) {
  return (
    <IntakeFlow
      title="Build your beginner plan"
      questions={BEGINNER_QUESTIONS}
      endpoint="/api/beginner"
      onClose={onClose}
    />
  );
}
