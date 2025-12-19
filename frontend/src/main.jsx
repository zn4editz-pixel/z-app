import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/animations.css"; // Critical CSS only
import "./styles/accessibility-fixes.css"; // Accessibility improvements - critical for WCAG compliance
import "./styles/navbar-hover.css"; // Navbar white hover/active states
import "./styles/remove-blue.css"; // Remove all blue colors - use theme colors only
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
// Import performance monitor in development
if (import.meta.env.DEV) {
  import("./utils/performanceMonitor.js");
}
// Import production security
import "./utils/productionSecurity.js";
// Preload critical resources
import {
  preloadCriticalResources,
  loadNonCriticalCSS,
} from "./utils/cssOptimizer.js";
// Initialize performance optimizations
preloadCriticalResources();
// Load non-critical CSS after initial render
setTimeout(() => {
  loadNonCriticalCSS();
}, 0);
// Ensure theme is applied before React renders
(function () {
  try {
    const theme = localStorage.getItem("chat-theme") || "dark";
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.add("react-loaded");
    document.body.classList.add("react-loaded");
    // Enable smooth transitions after a brief delay
    setTimeout(() => {
      const style = document.createElement("style");
      style.textContent = `
        html, body {
          transition: background-color 200ms ease, color 200ms ease !important;
        }
      `;
      document.head.appendChild(style);
    }, 100);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.classList.add("react-loaded");
    document.body.classList.add("react-loaded");
  }
})();
// Register service worker
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => { })
      .catch((error) => { });
  });
}
try {
  createRoot(document.getElementById("root")).render(
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
    </BrowserRouter>,
  );
} catch (error) {
  console.error("Failed to mount application:", error);
  document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;font-family:system-ui,sans-serif;"><h1>Unable to load application</h1><p>Please refresh the page.</p></div>';
}
