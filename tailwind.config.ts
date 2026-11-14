import type { Config } from "tailwindcss";

// Colours are CSS variables (see globals.css) so light/dark are selected, not auto-flipped.
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        page: v("page"),
        surface: v("surface"),
        raised: v("raised"),
        line: v("line"),
        ink: { DEFAULT: v("ink"), soft: v("ink-soft"), muted: v("ink-muted") },
        brand: { DEFAULT: v("brand"), strong: v("brand-strong"), soft: v("brand-soft"), ink: v("brand-ink") },
        accent: v("accent"),
        good: v("good"),
        warn: v("warn"),
        bad: v("bad"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      borderRadius: { xl: "0.9rem", "2xl": "1.25rem" },
    },
  },
  plugins: [],
} satisfies Config;
