import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        plum: {
          50: "#F5F0F8", 100: "#E9DDF1", 200: "#D8C6E3", 300: "#C3A7D2",
          400: "#9A74B3", 500: "#6F4A8E", 600: "#5D3D78", 700: "#4B315F",
          800: "#3E294E", 900: "#30203C",
        },
        blush: { 50: "#FDF5F7", 100: "#F6DDE3", 200: "#F0CDD6", 300: "#E9BAC6", 400: "#D994A5", 500: "#C9758A" },
        champagne: { 100: "#F4E9D6", 300: "#E6D0A9", 500: "#D8B982", 600: "#C4A36A" },
        ivory: { 50: "#FCF9F5", 100: "#F8F2EC", 200: "#F1E8DF" },
        ink: { 300: "#B8B1BA", 400: "#9B949D", 500: "#847D86", 600: "#716A73", 700: "#59525B", 800: "#403A42", 900: "#29242B" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-dm-serif)", "DM Serif Display", "Georgia", "serif"],
      },
      boxShadow: {
        fleora: "0 8px 30px rgba(75, 49, 95, 0.05)",
        lift: "0 16px 45px rgba(75, 49, 95, 0.10)",
      },
    },
  },
  plugins: [],
};
export default config;
