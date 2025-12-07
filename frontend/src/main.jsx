import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; // Critical CSS only
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";

// Defer non-critical CSS to speed up initial load
setTimeout(() => {
  import("./styles/responsive.css");
  import("./styles/mobile.css");
  import("./styles/smooth-transitions.css");
}, 0);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
