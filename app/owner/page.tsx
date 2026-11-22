"use client";
import OwnerDashboard from "@/components/OwnerDashboard";
import { PageSkeleton } from "@/components/ui";
import { useCtx } from "@/lib/useCtx";

export default function OwnerPage() {
  const ctx = useCtx();
  if (!ctx) return <PageSkeleton />;
  return <OwnerDashboard ctx={ctx} />;
}
