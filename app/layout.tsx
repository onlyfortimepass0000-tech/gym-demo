import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import TopNav from "@/components/TopNav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "KILO",
  description: "Gym operations demo — check-in, nutrition, workouts, trainer and owner dashboards.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-body min-h-screen">
        <TopNav />
        <main className="mx-auto max-w-[1240px] px-4 pb-20 pt-6">{children}</main>
      </body>
    </html>
  );
}
