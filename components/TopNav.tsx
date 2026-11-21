"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ROLES = [
  { label: "Member", href: "/member" },
  { label: "Beginner", href: "/beginner" },
  { label: "Trainer", href: "/trainer" },
  { label: "Owner", href: "/owner" },
];

export default function TopNav() {
  const pathname = usePathname();
  return (
    <div
      className="sticky top-0 z-10 border-b border-line backdrop-blur"
      style={{
        background: "rgba(10,11,13,0.82)",
        borderColor: "var(--line)",
        WebkitBackdropFilter: "saturate(140%) blur(14px)",
        backdropFilter: "saturate(140%) blur(14px)",
      }}
    >
      <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-4 py-3">
        <Link href="/member" className="flex items-center gap-2.5">
          <div
            className="grid h-[26px] w-[26px] place-items-center rounded-[7px] text-sm font-bold"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            K
          </div>
          <div className="leading-none">
            <div className="font-display text-xl font-bold tracking-tight">KILO</div>
            <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-fg-3">
              Thane West · Demo
            </div>
          </div>
        </Link>
        <div
          className="ml-auto flex min-w-0 gap-0.5 overflow-x-auto rounded-full border border-line p-[3px]"
          style={{ background: "var(--surface-2)" }}
        >
          {ROLES.map((r) => {
            const active = pathname === r.href || pathname.startsWith(r.href + "/");
            return (
              <Link
                key={r.href}
                href={r.href}
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors"
                style={
                  active
                    ? { background: "var(--accent)", color: "var(--accent-ink)", fontWeight: 600 }
                    : { color: "var(--fg-2)" }
                }
              >
                {r.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
