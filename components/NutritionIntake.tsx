"use client";
import IntakeFlow from "./IntakeFlow";
import { NUTRITION_QUESTIONS } from "@/lib/nutrition";

export default function NutritionIntake({ onClose }: { onClose: () => void }) {
  return (
    <IntakeFlow
      title="Your nutrition plan"
      questions={NUTRITION_QUESTIONS}
      endpoint="/api/nutrition"
      onClose={onClose}
    />
  );
}
