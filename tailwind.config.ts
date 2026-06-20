import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "hsl(var(--surface))",
          muted: "hsl(var(--surface-muted))",
        },
        card: "hsl(var(--card))",
        border: "hsl(var(--border))",
        foreground: "hsl(var(--foreground))",
        accent: "hsl(var(--accent))",
        "accent-hot": "hsl(var(--accent-hot))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        gold: "hsl(var(--gold))",
        redline: "hsl(var(--redline))",
        hero: "hsl(var(--hero))",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
