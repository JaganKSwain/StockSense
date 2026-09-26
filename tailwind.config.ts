import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0B",
        card: {
          DEFAULT: "#161618",
          foreground: "#FAFAFA",
        },
        popover: {
          DEFAULT: "#161618",
          foreground: "#FAFAFA",
        },
        primary: {
          DEFAULT: "#22D3EE",
          foreground: "#0A0A0B",
        },
        secondary: {
          DEFAULT: "#27272A",
          foreground: "#FAFAFA",
        },
        muted: {
          DEFAULT: "#1F1F23",
          foreground: "#A1A1AA",
        },
        accent: {
          DEFAULT: "#22D3EE",
          foreground: "#0A0A0B",
        },
        destructive: {
          DEFAULT: "#F87171",
          foreground: "#FAFAFA",
        },
        success: {
          DEFAULT: "#34D399",
          foreground: "#0A0A0B",
        },
        warning: {
          DEFAULT: "#FBBF24",
          foreground: "#0A0A0B",
        },
        border: "#27272A",
        input: "#27272A",
        ring: "#22D3EE",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      keyframes: {
        "cyan-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(34, 211, 238, 0)" },
          "50%": { boxShadow: "0 0 16px 2px rgba(34, 211, 238, 0.4)" },
        },
        "amber-flash": {
          "0%, 100%": { backgroundColor: "transparent" },
          "50%": { backgroundColor: "rgba(251, 191, 36, 0.15)" },
        },
      },
      animation: {
        "cyan-pulse": "cyan-pulse 1.2s ease-in-out",
        "amber-flash": "amber-flash 1.5s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
