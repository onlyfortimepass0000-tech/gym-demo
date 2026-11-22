"use client";
import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { checkIn } from "@/lib/store";
import { toast } from "@/components/ui";

function Scan() {
  const router = useRouter();
  const params = useSearchParams();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const as = params.get("as") === "riya" ? "riya" : "karan";
    checkIn(as);
    toast("Scanned at the door. You are checked in.");
    router.replace(as === "riya" ? "/beginner" : "/member");
  }, [params, router]);

  return (
    <div className="panel panel-pad max-w-md">
      <div className="kicker">Door scan</div>
      <h1 className="display mt-1 text-[34px]">Checking you in</h1>
      <p className="muted mt-2">One moment. You will land on your home screen.</p>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={null}>
      <Scan />
    </Suspense>
  );
}
