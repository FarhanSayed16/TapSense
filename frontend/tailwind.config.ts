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
        bg: {
          DEFAULT: "var(--bg)",
          subtle: "var(--bg-subtle)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          elevated: "var(--surface-elevated)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          secondary: "var(--ink-secondary)",
        },
        muted: "var(--muted)",
        brand: {
          DEFAULT: "var(--brand)",
          strong: "var(--brand-strong)",
          "800": "var(--brand-800)",
          soft: "var(--brand-soft)",
          wash: "var(--brand-wash)",
        },
        accent: "var(--accent)",
        line: "var(--line)",
        ok: {
          DEFAULT: "var(--ok)",
          bg: "var(--ok-bg)",
        },
        warn: {
          DEFAULT: "var(--warn)",
          bg: "var(--warn-bg)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          bg: "var(--danger-bg)",
        },
        info: {
          DEFAULT: "var(--info)",
          bg: "var(--info-bg)",
        },
        control: "var(--control)",
      },
      fontFamily: {
        display: ["Outfit", "system-ui", "sans-serif"],
        sans: ["Sora", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      spacing: {
        sidebar: "16.25rem", // 260px
      },
      maxWidth: {
        admin: "78rem", // 1248px — tighter, less stretched
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        soft: "0 1px 2px rgba(0,0,0,0.04)",
      },
      keyframes: {
        "page-enter": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "status-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.85)" },
        },
        "metric-settle": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "card-enter": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "flow-ripple": {
          "0%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.4)" },
          "70%": { boxShadow: "0 0 0 6px rgba(16, 185, 129, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0)" },
        },
      },
      animation: {
        "page-enter": "page-enter 200ms ease-out both",
        "status-pulse": "status-pulse 2s ease-in-out infinite",
        "metric-settle": "metric-settle 250ms ease-out both",
        "card-enter": "card-enter 300ms ease-out both",
        "flow-ripple": "flow-ripple 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
