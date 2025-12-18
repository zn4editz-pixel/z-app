/**
 * Mobile UI Enhancements for Instagram-style experience
 */
// Add touch feedback to elements
export const addTouchFeedback = (element) => {
  if (!element) return;
  element.addEventListener("touchstart", () => {
    element.style.transform = "scale(0.95)";
    element.style.opacity = "0.8";
    element.style.transition = "all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  });
  element.addEventListener("touchend", () => {
    element.style.transform = "scale(1)";
    element.style.opacity = "1";
  });
  element.addEventListener("touchcancel", () => {
    element.style.transform = "scale(1)";
    element.style.opacity = "1";
  });
};
// Fix mobile viewport issues
export const fixMobileViewport = () => {
  // Prevent zoom on input focus
  const inputs = document.querySelectorAll("input, textarea, select");
  inputs.forEach((input) => {
    input.style.fontSize = "16px";
  });
  // Fix mobile address bar color
  const updateThemeColor = () => {
    const themeColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--b1")
      .trim();
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.name = "theme-color";
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = `oklch(${themeColor})`;
  };
  updateThemeColor();
  // Update on theme change
  const observer = new MutationObserver(updateThemeColor);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
};
// Add Instagram-style page transitions
export const addPageTransition = (element) => {
  if (!element) return;
  element.style.animation =
    "pageSlideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards";
};
// Smooth scroll enhancement
export const enhanceSmoothScroll = () => {
  // Add smooth scrolling to all scrollable elements
  const scrollableElements = document.querySelectorAll(
    '[class*="overflow"], .scrollable',
  );
  scrollableElements.forEach((element) => {
    element.style.scrollBehavior = "smooth";
    element.style.webkitOverflowScrolling = "touch";
    element.style.overscrollBehavior = "contain";
  });
};
// Fix mobile bottom navigation color matching
export const fixMobileBottomNav = () => {
  const bottomNav = document.querySelector(".mobile-bottom-bar");
  if (!bottomNav) return;
  const updateBottomNavColor = () => {
    const bgColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--b1")
      .trim();
    const borderColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--bc")
      .trim();
    bottomNav.style.background = `oklch(${bgColor} / 0.95)`;
    bottomNav.style.borderTopColor = `oklch(${borderColor} / 0.08)`;
    bottomNav.style.backdropFilter = "blur(16px)";
  };
  updateBottomNavColor();
  // Update on theme change
  const observer = new MutationObserver(updateBottomNavColor);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
};
// Add Instagram-style button animations
export const enhanceButtons = () => {
  const buttons = document.querySelectorAll('button, .btn, [role="button"]');
  buttons.forEach((button) => {
    button.classList.add("instagram-button");
    addTouchFeedback(button);
  });
};
// Add Instagram-style card animations
export const enhanceCards = () => {
  const cards = document.querySelectorAll(
    '.card, [class*="bg-base-"], [class*="rounded"]',
  );
  cards.forEach((card) => {
    card.classList.add("instagram-card");
  });
};
// Initialize all mobile enhancements
export const initMobileEnhancements = () => {
  // Fix viewport issues
  const cleanupViewport = fixMobileViewport();
  // Fix bottom navigation
  const cleanupBottomNav = fixMobileBottomNav();
  // Enhance scrolling
  enhanceSmoothScroll();
  // Enhance interactive elements
  enhanceButtons();
  enhanceCards();
  // Add page transition to main content
  const mainContent = document.querySelector(
    "main, .main-content, #root > div",
  );
  if (mainContent) {
    addPageTransition(mainContent);
  }
  // Return cleanup function
  return () => {
    cleanupViewport?.();
    cleanupBottomNav?.();
  };
};
// Hook for React components
export const useMobileEnhancements = () => {
  React.useEffect(() => {
    const cleanup = initMobileEnhancements();
    return cleanup;
  }, []);
};
export default {
  addTouchFeedback,
  fixMobileViewport,
  addPageTransition,
  enhanceSmoothScroll,
  fixMobileBottomNav,
  enhanceButtons,
  enhanceCards,
  initMobileEnhancements,
  useMobileEnhancements,
};
