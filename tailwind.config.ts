import { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#f2f2f2", // Fondo claro por defecto
          dark: "#1f1f22", // Fondo principal en modo oscuro
        },
        foreground: {
          DEFAULT: "#1e293b", // Texto principal en modo claro
          dark: "#f5f5f5", // Texto principal en modo oscuro
        },
        border: {
          DEFAULT: "#e5e7eb", // Borde en modo claro
          dark: "#33363a", // Bordes en modo oscuro
        },
        muted: {
          DEFAULT: "#e5e7eb", // Texto secundario en modo claro
          dark: "#2d2f31", // Texto secundario en modo oscuro
        },
        primary: {
          DEFAULT: "#1e293b", // Azul grisáceo moderno
          dark: "#64748b", // Tonalidad primaria en modo oscuro
        },
        card: {
          DEFAULT: "#ffffff",
          dark: "#25262b", // Tarjetas o contenedores en modo oscuro
        },
        accent: {
          DEFAULT: "#6b7280",
          dark: "#9ca3af",
        },
      },
    },
  },
  plugins: [],
};

export default config;
