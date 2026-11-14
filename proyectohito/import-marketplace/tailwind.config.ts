import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Superficie principal de marca (botones, héroe, barra lateral). Oliva por defecto;
        // los valores viven en variables CSS (globals.css) para que cada tienda tenga su tema.
        brand: {
          50: "rgb(var(--brand-50) / <alpha-value>)",
          100: "rgb(var(--brand-100) / <alpha-value>)",
          200: "rgb(var(--brand-200) / <alpha-value>)",
          300: "rgb(var(--brand-300) / <alpha-value>)",
          400: "rgb(var(--brand-400) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
          700: "rgb(var(--brand-700) / <alpha-value>)",
          800: "rgb(var(--brand-800) / <alpha-value>)",
          900: "rgb(var(--brand-900) / <alpha-value>)",
          950: "rgb(var(--brand-950) / <alpha-value>)",
        },
        // Neutros cálidos (arena) en lugar del gris azulado por defecto.
        slate: {
          50: "#fafaf7",
          100: "#f1f0ea",
          200: "#e3e1d8",
          300: "#cfccbf",
          400: "#8f8c7d",
          500: "#6e6c61",
          600: "#57554c",
          700: "#424139",
          800: "#2c2b25",
          900: "#1c1c17",
          950: "#10100c",
        },
        // Lima: único acento. Solo para la acción principal y el estado activo.
        lima: {
          DEFAULT: "rgb(var(--lima) / <alpha-value>)",
          fuerte: "rgb(var(--lima-fuerte) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
