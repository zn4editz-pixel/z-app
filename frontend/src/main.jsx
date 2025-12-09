import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; // Critical CSS only
import "./styles/accessibility-fixes.css"; // Accessibility improvements - critical for WCAG compliance
import "./styles/navbar-hover.css"; // Navbar white hover/active states
import "./styles/remove-blue.css"; // Remove all blue colors - use theme colors only
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";

// Defer non-critical CSS to speed up initial load
setTimeout(() => {
  import("./styles/responsive.css");
  import("./styles/mobile.css");
  import("./styles/smooth-transitions.css");
}, 0);

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
