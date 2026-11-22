import type { Metadata, Viewport } from "next";
import { Archivo, Big_Shoulders_Display, IBM_Plex_Mono } from "next/font/google";
import TopNav from "@/components/TopNav";
import { Toaster } from "@/components/ui";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const display = Big_Shoulders_Display({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Archivo({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: `${BRAND.name} · ${BRAND.tagline}`,
  description: "Check-in, attendance calendar, generated workout and nutrition plans, and live trainer and owner dashboards.",
};

export const viewport: Viewport = { themeColor: "#111318", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen font-body">
        <TopNav />
        <main className="mx-auto max-w-[1240px] px-4 pb-24 pt-6">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
