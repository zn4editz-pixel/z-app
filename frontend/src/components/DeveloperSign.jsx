import { useThemeStore } from "../store/useThemeStore";
import { Code2 } from "lucide-react";

const DeveloperLogo = () => {
  const { theme } = useThemeStore();

  const getColors = () => {
    switch (theme) {
      case "dark":
        return {
          text: "text-yellow-400",
          glow: "shadow-yellow-400/50",
          border: "border-yellow-400/30"
        };
      case "light":
        return {
          text: "text-gray-800",
          glow: "shadow-gray-400/50",
          border: "border-gray-300"
        };
      case "dracula":
        return {
          text: "text-purple-400",
          glow: "shadow-purple-400/50",
          border: "border-purple-400/30"
        };
      default:
        return {
          text: "text-primary",
          glow: "shadow-primary/50",
          border: "border-primary/30"
        };
    }
  };

  const colors = getColors();

  return (
    <a
      href="https://github.com/z4fwn" // Replace with your actual link
      target="_blank"
      rel="noopener noreferrer"
      title="Made by z4fwn"
      className={`fixed bottom-4 right-4 z-50 
        flex items-center gap-2 px-4 py-2 
        bg-base-100/80 backdrop-blur-sm
        border ${colors.border}
        rounded-full shadow-lg ${colors.glow}
        opacity-60 hover:opacity-100 
        transition-all duration-300 
        hover:scale-105 hover:shadow-xl
        hidden sm:flex
        group`}
    >
      <Code2 className={`w-4 h-4 ${colors.text} group-hover:rotate-12 transition-transform duration-300`} />
      <span className={`text-xs font-semibold ${colors.text} tracking-wide`}>
        made by <span className="font-bold">z4fwn</span>
      </span>
    </a>
  );
};

export default DeveloperLogo;
