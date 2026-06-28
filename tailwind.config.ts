import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bcdaff",
          300: "#8ec3ff",
          400: "#59a2ff",
          500: "#327dff",
          600: "#1c5df5",
          700: "#1648e1",
          800: "#193cb6",
          900: "#1a378f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
