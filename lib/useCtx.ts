"use client";
import { useMemo } from "react";
import { useNow, useStore } from "./store";
import type { Ctx } from "./selectors";

// Null until the browser has loaded persisted state and a clock reading, so
// server markup and first client render always match.
export function useCtx(): Ctx | null {
  const store = useStore();
  const now = useNow();
  return useMemo(() => (store && now ? { store, now } : null), [store, now]);
}
