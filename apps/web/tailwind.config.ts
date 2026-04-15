import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#f2f3f7",
        surface: "#ffffff",
        text: "#141727",
        muted: "#666f87",
        stroke: "#e5e9f3"
      },
      boxShadow: {
        soft: "0 16px 45px rgba(25, 36, 77, 0.08)"
      },
      borderRadius: {
        card: "30px"
      },
      maxWidth: {
        canvas: "1280px"
      }
    }
  },
  plugins: []
};

export default config;
