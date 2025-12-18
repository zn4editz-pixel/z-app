import { create } from "zustand";
const getInitialTheme = () => {
  // Get theme from localStorage or default to dark
  const storedTheme = localStorage.getItem("chat-theme");
  if (storedTheme) return storedTheme;
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "dark"; // Default to dark
};
export const useThemeStore = create((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    // Only update if theme actually changed to prevent unnecessary re-renders
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme !== theme) {
      localStorage.setItem("chat-theme", theme);
      document.documentElement.setAttribute("data-theme", theme);
      set({ theme });
    }
  },
}));
