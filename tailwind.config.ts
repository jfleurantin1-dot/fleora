import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Fleora brand — soft plum / blush
        plum: {
          50: "#faf5fb",
          100: "#f3e8f6",
          200: "#e7d0ee",
          300: "#d4addf",
          400: "#bd83cc",
          500: "#a45cb5",
          600: "#894299",
          700: "#6f357c",
          800: "#5c2d66",
          900: "#4d2955",
        },
        blush: {
          50: "#fdf2f6",
          100: "#fce7ef",
          200: "#fbcfe0",
          300: "#f8a9c6",
          400: "#f273a3",
          500: "#e84a83",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
