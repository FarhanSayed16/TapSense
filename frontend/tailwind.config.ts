import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        brand: {
          DEFAULT: "var(--brand)",
          strong: "var(--brand-strong)",
        },
        accent: "var(--accent)",
        line: "var(--line)",
        ok: "var(--ok)",
        warn: "var(--warn)",
        danger: "var(--danger)",
        control: "var(--control)",
      },
      fontFamily: {
        display: ["Outfit", "system-ui", "sans-serif"],
        sans: ["Sora", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      spacing: {
        // 8px grid helpers already via default; keep sidebar width
        sidebar: "15.5rem",
      },
      maxWidth: {
        admin: "90rem",
      },
      keyframes: {
        "page-enter": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "status-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(0.92)" },
        },
        "metric-settle": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "page-enter": "page-enter 180ms ease-out both",
        "status-pulse": "status-pulse 1.8s ease-in-out infinite",
        "metric-settle": "metric-settle 220ms ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;
