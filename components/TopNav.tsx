"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BRAND } from "@/lib/brand";
import { resetDemo } from "@/lib/store";
import { toast } from "./ui";

const ROLES = [
  { href: "/member", label: "Member", who: "Karan Mehta · regular member, 5 months in", hint: "Check in, log sets, see the calendar, get a nutrition plan." },
  { href: "/beginner", label: "Beginner", who: "Riya Patel · joined today", hint: "Answer five questions and get a plan built around the answers." },
  { href: "/trainer", label: "Trainer", who: "Coach Vikrant Shah · 13 clients", hint: "Every client's attendance, sets and progress. Message them." },
  { href: "/owner", label: "Owner", who: "Owner · whole gym", hint: "Footfall, revenue, churn risk, trainers and sign-ups." },
] as const;

function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
      <circle cx="15" cy="15" r="14" fill="#ffd21f" stroke="#111318" strokeWidth="2" />
      <circle cx="15" cy="15" r="9.5" fill="none" stroke="#111318" strokeWidth="1.5" />
      <circle cx="15" cy="15" r="3" fill="#111318" />
    </svg>
  );
}

function Nav() {
  const pathname = usePathname();
  const search = useSearchParams();
  const from = search.get("from");
  const active = pathname.startsWith("/clients") ? (from === "owner" ? "/owner" : "/trainer") : pathname;
  const current = ROLES.find((r) => active.startsWith(r.href));

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-ink text-white">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
          <Link href="/member" className="flex items-center gap-2.5" aria-label={`${BRAND.name} home`}>
            <Logo />
            <span className="display text-[28px] leading-none tracking-wide">{BRAND.name}</span>
            <span className="kicker hidden !text-[#9a9ea8] sm:inline">{BRAND.tagline}</span>
          </Link>
          <nav className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:ml-auto sm:w-auto" aria-label="Demo roles">
            {ROLES.map((r) => {
              const on = active.startsWith(r.href);
              return (
                <Link
                  key={r.href}
                  href={r.href}
                  aria-current={on ? "page" : undefined}
                  className={`display whitespace-nowrap px-4 py-2 text-[18px] leading-none transition-colors ${
                    on ? "bg-yellow text-ink" : "text-[#c9ccd3] hover:bg-[#262a33] hover:text-white"
                  }`}
                >
                  {r.label}
                </Link>
              );
            })}
          </nav>
          <button
            className="btn btn-sm !border-[#555a64] !bg-transparent !text-white !shadow-none hover:!bg-[#262a33]"
            onClick={() => {
              resetDemo();
              toast("Demo reset. Back to the starting data.");
            }}
          >
            Reset demo
          </button>
        </div>
      </div>
      {current && (
        <div className="border-b border-line-strong bg-yellow">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-baseline gap-x-4 gap-y-0.5 px-4 py-1.5 text-[13px]">
            <span className="kicker !text-ink">Viewing as</span>
            <span className="font-bold">{current.who}</span>
            <span className="text-ink-2">{current.hint}</span>
          </div>
        </div>
      )}
    </header>
  );
}

export default function TopNav() {
  return (
    <Suspense fallback={<div className="h-[52px] bg-ink" />}>
      <Nav />
    </Suspense>
  );
}
