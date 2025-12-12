/**
 * Background Enhancement Utilities
 * Easy-to-use functions for applying amazing background variations
 */

/**
 * Get CSS classes for different background zones
 */
export const backgroundZones = {
  // Main zones
  main: 'bg-main',
  bright: 'bg-bright hover-bright',
  dark: 'bg-dark hover-dark',
  elevated: 'bg-elevated',
  
  // Accent zones
  accentLight: 'bg-accent-light',
  accentDark: 'bg-accent-dark',
  
  // Gradient zones
  gradientSubtle: 'bg-gradient-subtle',
  gradientBright: 'bg-gradient-bright',
  gradientDark: 'bg-gradient-dark',
  
  // Special zones
  hero: 'bg-gradient-bright bg-textured section-glow',
  featured: 'bg-accent-light border-enhanced depth-2',
  interactive: 'bg-elevated interactive-zone bg-transition',
  
  // State-based backgrounds
  success: 'success-state',
  warning: 'warning-state',
  error: 'bg-bright', // Will be enhanced by error-modal class if modal
  
  // Component-specific
  navbar: 'bg-bright depth-1',
  sidebar: 'bg-dark border-subtle',
  card: 'bg-elevated depth-1 bg-transition',
  cardPrimary: 'bg-bright border-enhanced depth-2',
  modal: 'bg-bright depth-3',
  
  // Mobile optimized
  mobileHeader: 'bg-bright',
  mobileNav: 'bg-dark',
  mobileCard: 'bg-elevated border-subtle'
};

/**
 * Get background class based on component type and position
 */
export const getBackgroundClass = (componentType, options = {}) => {
  const { position = 'default', featured = false, mobile = false } = options;
  
  // Mobile-first approach
  if (mobile) {
    switch (componentType) {
      case 'header': return backgroundZones.mobileHeader;
      case 'nav': return backgroundZones.mobileNav;
      case 'card': return backgroundZones.mobileCard;
      default: return backgroundZones.main;
    }
  }
  
  // Desktop/tablet backgrounds
  switch (componentType) {
    case 'hero':
      return backgroundZones.hero;
      
    case 'navbar':
    case 'header':
      return backgroundZones.navbar;
      
    case 'sidebar':
    case 'drawer':
      return backgroundZones.sidebar;
      
    case 'card':
      if (featured) return backgroundZones.cardPrimary;
      return position === 'odd' ? backgroundZones.bright : backgroundZones.card;
      
    case 'modal':
      return backgroundZones.modal;
      
    case 'section':
      switch (position) {
        case 'odd': return backgroundZones.bright;
        case 'even': return backgroundZones.elevated;
        case 'accent': return backgroundZones.accentLight;
        default: return backgroundZones.main;
      }
      
    case 'chat':
      switch (position) {
        case 'sidebar': return backgroundZones.dark;
        case 'header': return backgroundZones.bright;
        case 'input': return backgroundZones.elevated;
        default: return backgroundZones.main;
      }
      
    case 'profile':
      switch (position) {
        case 'header': return backgroundZones.gradientBright;
        case 'stats': return backgroundZones.dark;
        case 'section': return backgroundZones.elevated;
        default: return backgroundZones.main;
      }
      
    case 'admin':
      switch (position) {
        case 'overview': return backgroundZones.gradientBright;
        case 'panel': return backgroundZones.elevated;
        case 'critical': return 'alert-critical';
        default: return backgroundZones.main;
      }
      
    default:
      return backgroundZones.main;
  }
};

/**
 * Generate alternating background classes for lists
 */
export const getAlternatingBackground = (index, type = 'default') => {
  const isOdd = index % 2 === 0; // 0-based index, so 0 is "first" (odd position)
  
  switch (type) {
    case 'cards':
      return isOdd ? backgroundZones.bright : backgroundZones.elevated;
      
    case 'sections':
      return isOdd ? backgroundZones.elevated : backgroundZones.bright;
      
    case 'admin-panels':
      return isOdd ? backgroundZones.dark : backgroundZones.bright;
      
    case 'discover-users':
      // 4-item pattern for user cards
      const pattern = index % 4;
      return (pattern === 0 || pattern === 3) ? backgroundZones.elevated : backgroundZones.bright;
      
    default:
      return isOdd ? backgroundZones.elevated : backgroundZones.main;
  }
};

/**
 * Get background class with state
 */
export const getStateBackground = (state, baseType = 'card') => {
  const base = backgroundZones[baseType] || backgroundZones.card;
  
  switch (state) {
    case 'success':
      return `${base} success-state`;
    case 'warning':
      return `${base} warning-state`;
    case 'error':
      return `${base} error-modal`;
    case 'loading':
      return `${base} loading-container`;
    case 'featured':
      return `${base} featured`;
    case 'active':
      return `${backgroundZones.accentLight} border-enhanced`;
    default:
      return base;
  }
};

/**
 * Responsive background classes
 */
export const getResponsiveBackground = (componentType, options = {}) => {
  const desktop = getBackgroundClass(componentType, options);
  const mobile = getBackgroundClass(componentType, { ...options, mobile: true });
  
  return {
    desktop,
    mobile,
    combined: `${desktop} md:${desktop} ${mobile} md:${mobile}` // Tailwind responsive classes
  };
};

/**
 * Theme-aware background utilities
 */
export const themeBackgrounds = {
  // Light theme optimizations
  light: {
    bright: 'bg-bright',
    dark: 'bg-dark',
    contrast: 'bg-dark' // Use dark for contrast in light theme
  },
  
  // Dark theme optimizations  
  dark: {
    bright: 'bg-bright',
    dark: 'bg-dark', 
    contrast: 'bg-bright' // Use bright for contrast in dark theme
  }
};

/**
 * Animation and transition utilities
 */
export const backgroundAnimations = {
  transition: 'bg-transition',
  hover: 'hover-bright',
  hoverDark: 'hover-dark',
  glow: 'section-glow',
  float: 'floating-element',
  interactive: 'interactive-zone',
  textured: 'bg-textured'
};

/**
 * Utility function to combine multiple background classes
 */
export const combineBackgrounds = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Get background for specific page layouts
 */
export const pageBackgrounds = {
  homepage: {
    hero: backgroundZones.hero,
    welcome: backgroundZones.elevated,
    features: backgroundZones.bright
  },
  
  chat: {
    sidebar: backgroundZones.dark,
    messages: backgroundZones.main,
    header: backgroundZones.bright,
    input: backgroundZones.elevated
  },
  
  profile: {
    banner: backgroundZones.gradientBright,
    stats: backgroundZones.dark,
    sections: backgroundZones.elevated
  },
  
  discover: {
    header: backgroundZones.bright,
    userCards: backgroundZones.elevated,
    featured: backgroundZones.accentLight
  },
  
  admin: {
    overview: backgroundZones.gradientBright,
    panels: backgroundZones.elevated,
    alerts: 'alert-critical'
  },
  
  settings: {
    header: backgroundZones.accentLight,
    sections: backgroundZones.elevated
  }
};

/**
 * Easy-to-use presets for common patterns
 */
export const backgroundPresets = {
  // Card patterns
  cardGrid: (index) => getAlternatingBackground(index, 'cards'),
  userGrid: (index) => getAlternatingBackground(index, 'discover-users'),
  
  // Section patterns
  alternatingSection: (index) => getAlternatingBackground(index, 'sections'),
  
  // Component patterns
  chatSidebar: () => backgroundZones.dark,
  chatHeader: () => backgroundZones.bright,
  heroSection: () => backgroundZones.hero,
  modalDialog: () => backgroundZones.modal,
  
  // State patterns
  successCard: () => getStateBackground('success'),
  warningCard: () => getStateBackground('warning'),
  errorCard: () => getStateBackground('error'),
  featuredCard: () => getStateBackground('featured'),
  
  // Interactive patterns
  hoverCard: () => combineBackgrounds(backgroundZones.card, backgroundAnimations.hover, backgroundAnimations.transition),
  interactiveZone: () => combineBackgrounds(backgroundZones.elevated, backgroundAnimations.interactive),
  
  // Mobile patterns
  mobileOptimized: (type) => getBackgroundClass(type, { mobile: true })
};

export default {
  backgroundZones,
  getBackgroundClass,
  getAlternatingBackground,
  getStateBackground,
  getResponsiveBackground,
  themeBackgrounds,
  backgroundAnimations,
  combineBackgrounds,
  pageBackgrounds,
  backgroundPresets
};