import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        board: {
          light: "#eadfce",
          dark: "#1b1410",
        },
        point: {
          a: "#a5673f",
          b: "#e8cf9c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
