import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#1B2A4A", light: "#2A3F6B", dark: "#12203A" },
        teal: { DEFAULT: "#0E7C7B", light: "#E6F2F2", dark: "#0A5F5E" },
        cream: "#F7F7F5",
      },
    },
  },
  plugins: [],
};
export default config;
