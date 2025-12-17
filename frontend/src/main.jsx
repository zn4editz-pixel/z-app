import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css"
import "./styles/animations.css"; // Critical CSS only
import "./styles/accessibility-fixes.css"; // Accessibility improvements - critical for WCAG compliance
import "./styles/navbar-hover.css"; // Navbar white hover/active states
import "./styles/remove-blue.css"; // Remove all blue colors - use theme colors only
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";

// Import production security (will only activate in production)
import "./utils/productionSecurity.js";

// Defer non-critical CSS to speed up initial load
setTimeout(() => {
  import("./styles/responsive.css");
  import("./styles/mobile.css");
  import("./styles/smooth-transitions.css");
  import("./styles/stranger-chat.css");
}, 0);

// Ensure theme is applied before React renders to prevent flash
(function() {
  try {
    const theme = localStorage.getItem('chat-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    
    // Add class to indicate React has loaded (prevents theme flash)
    document.documentElement.classList.add('react-loaded');
    document.body.classList.add('react-loaded');
    
    // Enable smooth transitions after a brief delay
    setTimeout(() => {
      const style = document.createElement('style');
      style.textContent = `
        html, body {
          transition: background-color 200ms ease, color 200ms ease !important;
        }
      `;
      document.head.appendChild(style);
    }, 100);
    
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('react-loaded');
    document.body.classList.add('react-loaded');
  }
})();

createRoot(document.getElementById("root")).render(
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}
  >
    <App />
  </BrowserRouter>
);
