import { create } from "zustand";

const getInitialTheme = () => {
  const storedTheme = localStorage.getItem("chat-theme");
  if (storedTheme) return storedTheme;

  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "dark"; // Default to dark instead of coffee
};

export const useThemeStore = create((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
  },
}));
