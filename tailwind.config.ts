import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0b0d",
        surface: "#121418",
        "surface-2": "#181b21",
        line: "#23272f",
        "line-2": "#2c313b",
        fg: "#f1f2f4",
        "fg-2": "#a4a9b4",
        "fg-3": "#6b7280",
        accent: "#d4ff3d",
        "accent-ink": "#0a0b0d",
        warm: "#ff8a3d",
        danger: "#ff5c5c",
        good: "#58d68d",
      },
      fontFamily: {
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "var(--font-inter)", "sans-serif"],
        mono: ["ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
