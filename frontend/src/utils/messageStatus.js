/**
 * Message Status Utility
 * Handles message status logic based on online status and read receipts
 */

/**
 * Get message status display information with enhanced online/offline logic
 * @param {Object} message - The message object
 * @param {boolean} isMyMessage - Whether the message is from current user
 * @param {boolean} isReceiverOnline - Whether the receiver is online
 * @param {Object} themeColors - Theme colors for styling
 * @returns {Object} Status display information
 */
export const getMessageStatusInfo = (message, isMyMessage, isReceiverOnline, themeColors) => {
  if (!isMyMessage) {
    return { show: false };
  }

  const status = message.status || 'sent';
  const isRead = message.readAt || message.isRead;
  const isDelivered = message.deliveredAt || message.isDelivered;
  
  // ✅ ENHANCED: Priority order - Read > Delivered > Sent based on online status
  
  // If message is read - show colored double tick (theme color)
  if (isRead) {
    return {
      show: true,
      type: 'double-tick',
      color: themeColors.primary,
      animate: 'animate-check-mark-read',
      tooltip: 'Read'
    };
  }
  
  // If message is delivered OR receiver is online - show gray double tick
  if (isDelivered || (isReceiverOnline && status !== 'sending' && status !== 'failed')) {
    return {
      show: true,
      type: 'double-tick',
      color: 'hsl(var(--bc) / 0.5)',
      animate: 'animate-check-mark',
      tooltip: 'Delivered'
    };
  }
  
  // Handle specific statuses
  switch (status) {
    case 'sending':
      return {
        show: true,
        type: 'clock',
        color: 'hsl(var(--bc) / 0.4)',
        animate: 'animate-pulse',
        tooltip: 'Sending...'
      };
      
    case 'failed':
      return {
        show: true,
        type: 'clock',
        color: 'hsl(var(--er))',
        animate: 'animate-pulse',
        tooltip: 'Failed to send'
      };
      
    case 'sent':
    default:
      // If receiver is offline - show single tick
      if (!isReceiverOnline) {
        return {
          show: true,
          type: 'single-tick',
          color: 'hsl(var(--bc) / 0.4)',
          animate: '',
          tooltip: 'Sent'
        };
      }
      
      // If receiver is online but not delivered yet - show double tick
      return {
        show: true,
        type: 'double-tick',
        color: 'hsl(var(--bc) / 0.5)',
        animate: 'animate-check-mark',
        tooltip: 'Delivered'
      };
  }
};

/**
 * Get theme-based colors for different daisyUI themes
 * @param {string} theme - Current theme name
 * @returns {Object} Theme colors
 */
export const getThemeColors = (theme) => {
  const themeColorMap = {
    // Light themes
    'light': { primary: '#570df8', secondary: '#f000b8', accent: '#37cdbe', success: '#00d084' },
    'cupcake': { primary: '#65c3c8', secondary: '#ef9fbc', accent: '#eeaf3a', success: '#00d084' },
    'bumblebee': { primary: '#e0a82e', secondary: '#f9d72f', accent: '#181830', success: '#00d084' },
    'emerald': { primary: '#66cc8a', secondary: '#377cfb', accent: '#ea5234', success: '#00d084' },
    'corporate': { primary: '#4b6bfb', secondary: '#7b92b2', accent: '#67cba0', success: '#00d084' },
    'valentine': { primary: '#e96d7b', secondary: '#a991f7', accent: '#88dbdd', success: '#00d084' },
    'garden': { primary: '#5c7f67', secondary: '#ecf4e7', accent: '#fae5e5', success: '#00d084' },
    'aqua': { primary: '#09ecf3', secondary: '#966fb3', accent: '#ffe999', success: '#00d084' },
    'lofi': { primary: '#0d0d0d', secondary: '#1a1a1a', accent: '#262626', success: '#00d084' },
    'pastel': { primary: '#d1c1d7', secondary: '#f6cbd1', accent: '#b4e9d6', success: '#00d084' },
    'fantasy': { primary: '#6e0b75', secondary: '#007ebd', accent: '#f28c18', success: '#00d084' },
    'wireframe': { primary: '#b8b8b8', secondary: '#b8b8b8', accent: '#b8b8b8', success: '#00d084' },
    'cmyk': { primary: '#45aeee', secondary: '#e8488a', accent: '#ffc22d', success: '#00d084' },
    'autumn': { primary: '#8c0327', secondary: '#d85251', accent: '#f3cc30', success: '#00d084' },
    'business': { primary: '#1c4ed8', secondary: '#7c2d12', accent: '#dc2626', success: '#00d084' },
    'acid': { primary: '#ff00ff', secondary: '#ffff00', accent: '#00ffff', success: '#00d084' },
    'lemonade': { primary: '#519903', secondary: '#e9e92f', accent: '#bf0000', success: '#00d084' },
    'winter': { primary: '#047aed', secondary: '#463aa2', accent: '#c148ac', success: '#00d084' },
    
    // Dark themes
    'dark': { primary: '#661ae6', secondary: '#d926aa', accent: '#1fb2a5', success: '#00d084' },
    'synthwave': { primary: '#e779c1', secondary: '#58c7f3', accent: '#f3cc30', success: '#00d084' },
    'retro': { primary: '#ef9995', secondary: '#a4cbb4', accent: '#fbbf24', success: '#00d084' },
    'cyberpunk': { primary: '#ff7598', secondary: '#75d1f0', accent: '#c7f59b', success: '#00d084' },
    'halloween': { primary: '#f28c18', secondary: '#6d3a9c', accent: '#51a800', success: '#00d084' },
    'forest': { primary: '#1eb854', secondary: '#1fd65f', accent: '#fbbf24', success: '#00d084' },
    'black': { primary: '#343232', secondary: '#343232', accent: '#343232', success: '#00d084' },
    'luxury': { primary: '#ffffff', secondary: '#152747', accent: '#513448', success: '#00d084' },
    'dracula': { primary: '#ff79c6', secondary: '#bd93f9', accent: '#ffb86c', success: '#50fa7b' },
    'night': { primary: '#38bdf8', secondary: '#818cf8', accent: '#f471b5', success: '#00d084' },
    'coffee': { primary: '#db924b', secondary: '#263e3f', accent: '#10576d', success: '#00d084' },
    'dim': { primary: '#9ca3af', secondary: '#9ca3af', accent: '#9ca3af', success: '#00d084' },
    'nord': { primary: '#5e81ac', secondary: '#81a1c1', accent: '#88c0d0', success: '#a3be8c' },
    'sunset': { primary: '#ff8a65', secondary: '#ffb74d', accent: '#a1887f', success: '#81c784' }
  };
  
  return themeColorMap[theme] || themeColorMap['coffee'];
};

/**
 * Get reaction badge styling - EXACT Instagram Design with Removal Feedback
 * @param {boolean} hasMyReaction - Whether current user has reacted
 * @param {Object} themeColors - Theme colors
 * @returns {Object} Styling object
 */
export const getReactionBadgeStyle = (hasMyReaction, themeColors) => {
  if (hasMyReaction) {
    // ✅ INSTAGRAM EXACT: My reaction - removable with colorful border
    return {
      backgroundColor: '#ffffff',
      borderColor: themeColors.primary,
      boxShadow: `0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)`,
      color: '#333333',
      fontWeight: '600',
      cursor: 'pointer',
      // Subtle hint that it's removable
      transform: 'scale(1.02)'
    };
  }
  
  // ✅ INSTAGRAM EXACT: Others' reactions - view only
  return {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(0, 0, 0, 0.12)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    color: '#333333',
    fontWeight: '600',
    cursor: 'pointer',
    opacity: 0.9
  };
};