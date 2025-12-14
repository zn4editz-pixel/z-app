import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          "base-100": "#ffffff", // Pure white background
          "base-200": "#f8fafc", // Very light grey for secondary backgrounds
          "base-300": "#f1f5f9", // Light grey for borders
          "base-content": "#0f172a", // Darker slate-900 text for high contrast
          "primary": "#0f172a", // Also using dark color for primary if requested
          "neutral": "#0f172a", // Dark neutral background
          "neutral-content": "#ffffff", // White text on neutral
          "info": "#0ea5e9",
          "info-content": "#0f172a",
          "success-content": "#0f172a",
          "warning-content": "#0f172a",
          "error-content": "#0f172a",
        },
      },
      "dark",
      "bumblebee",
      "synthwave",
      "retro",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel",
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula",
      "cmyk",
      "business",
      "acid",
      "lemonade",
      "night",
      "coffee",
      "dim",
      "sunset",
    ],
  },
};
