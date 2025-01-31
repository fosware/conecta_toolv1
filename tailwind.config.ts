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
        "background-dark": "#1D2532",
        card: "rgb(var(--card) / <alpha-value>)",
        "card-dark": "#1D2532",
        hover: "rgb(var(--hover) / <alpha-value>)",
      },
      textColor: {
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        "foreground-dark": "#ffffff",
        muted: "rgb(var(--muted) / <alpha-value>)",
        "muted-dark": "#b5c1d9",
      },
      borderColor: {
        border: "#EEF1F6",
        "border-dark": "#1D2532",
      },
      colors: {
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          dark: "#CC9F26",
        },
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          dark: "#1D2532",
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
          dark: "#CC9F26",
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
