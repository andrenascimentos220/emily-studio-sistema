import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Vinculando as fontes das variáveis do layout
        cinzel: ["var(--font-cinzel-standard)"],
        lato: ["var(--font-lato-standard)"],
      },
      colors: {
        primary: {
          light: "#F7ACCF",   // Rosa claro (Base)
          DEFAULT: "#D49FAF", // Rosa médio (Destaques)
          dark: "#A16585",    // Rosa escuro (Hover/Sombras)
        },
        secondary: {
          light: "#E0E0E0",   
          DEFAULT: "#373F47", // Grafite oficial
          dark: "#262D33",
        },
        background: "#FAFAFA",
      },
    },
  },
  plugins: [],
};
export default config;