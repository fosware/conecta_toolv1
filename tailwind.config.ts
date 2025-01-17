import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundColor: {
        background: "rgb(var(--background) / <alpha-value>)",
        "background-dark": "#1A1C1E",
        card: "rgb(var(--card) / <alpha-value>)",
        "card-dark": "#232629",
        hover: "rgb(var(--hover) / <alpha-value>)",
      },
      textColor: {
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        "foreground-dark": "#E6EDF3",
        muted: "rgb(var(--muted) / <alpha-value>)",
        "muted-dark": "#2F3337",
      },
      borderColor: {
        border: "rgb(var(--border) / <alpha-value>)",
        "border-dark": "#2F3337",
      },
      colors: {
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          dark: "#9CA3AF",
        },
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          dark: "#9CA3AF",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          dark: "#F85149",
        },
        success: {
          DEFAULT: "rgb(var(--success) / <alpha-value>)",
          dark: "#2EA043",
        },
        warning: {
          DEFAULT: "rgb(var(--warning) / <alpha-value>)",
          dark: "#BB8009",
        },
        info: {
          DEFAULT: "rgb(var(--info) / <alpha-value>)",
          dark: "#367BF0",
        },
      },
    },
  },
  plugins: [],
};

export default config;
