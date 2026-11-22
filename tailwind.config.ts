import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        "panel-2": "var(--panel-2)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        yellow: "var(--yellow)",
        "yellow-deep": "var(--yellow-deep)",
        "yellow-bg": "var(--yellow-bg)",
        green: "var(--green)",
        "green-bg": "var(--green-bg)",
        red: "var(--red)",
        "red-bg": "var(--red-bg)",
        blue: "var(--blue)",
        "blue-bg": "var(--blue-bg)",
      },
      fontFamily: {
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Impact", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
