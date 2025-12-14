import daisyui from "daisyui";
// Force Rebuild: Theme Config Update


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
        ...require("daisyui/src/theming/themes")["light"],
        // "base-100": "#ffffff", // Use default
        // "base-content": "#1f2937", // Standard dark grey, not blue

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
