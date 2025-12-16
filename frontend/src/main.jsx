import { createRoot } from "react-dom/client";
import "./index.css"
import "./styles/animations.css"; // Critical CSS only
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
  import("./styles/stranger-chat.css");
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
import { createRoot } from "react-dom/client";
import "./index.css"
import "./styles/animations.css"; // Critical CSS only
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
  import("./styles/stranger-chat.css");
}, 0);

// 🔧 DEVELOPMENT: Load instant read status fix for debugging
if (import.meta.env.DEV) {
  setTimeout(() => {
    // Load the instant fix script content
    const instantFixScript = `
// 🔧 INSTANT READ STATUS FIX - Auto-loaded in development
console.log('🔧 Auto-loading instant read status fix...');

const instantReadStatusFix = {
  updateMessageStatusInstantly: (messageId, status) => {
    console.log(\`⚡ INSTANT UPDATE: Message \${messageId} -> \${status}\`);
    
    // Update React stores
    try {
      const chatStore = window.useChatStore?.getState?.();
      if (chatStore?.updateMessageStatus) {
        chatStore.updateMessageStatus(messageId, status);
      }
      
      const statusStore = window.useMessageStatusStore?.getState?.();
      if (statusStore?.updateStatus) {
        const statusData = { status };
        if (status === 'read') {
          statusData.isRead = true;
          statusData.readAt = new Date().toISOString();
        } else if (status === 'delivered') {
          statusData.isDelivered = true;
          statusData.deliveredAt = new Date().toISOString();
        }
        statusStore.updateStatus(messageId, statusData);
      }
    } catch (error) {
      console.error('❌ Error updating stores:', error);
    }
    
    // Update DOM directly
    const messageElements = document.querySelectorAll(\`[data-message-id="\${messageId}"]\`);
    messageElements.forEach(el => {
      const statusElements = el.querySelectorAll('svg, .message-status');
      statusElements.forEach(statusEl => {
        if (status === 'read') {
          statusEl.classList.remove('text-base-content/40', 'text-gray-400');
          statusEl.classList.add('text-primary');
        } else {
          statusEl.classList.remove('text-primary');
          statusEl.classList.add('text-base-content/40');
        }
      });
    });
    
    console.log(\`✅ Updated \${messageElements.length} message elements\`);
  },
  
  hookSocketEvents: () => {
    const socket = window.useAuthStore?.getState?.()?.socket;
    if (!socket) return;
    
    socket.off('messagesRead');
    socket.off('messagesDelivered');
    socket.off('messageDelivered');
    
    socket.on('messagesRead', (data) => {
      console.log('👀 SOCKET: messagesRead', data);
      if (data.messageIds) {
        data.messageIds.forEach(id => instantReadStatusFix.updateMessageStatusInstantly(id, 'read'));
      }
    });
    
    socket.on('messagesDelivered', (data) => {
      console.log('📬 SOCKET: messagesDelivered', data);
      if (data.messageIds) {
        data.messageIds.forEach(id => instantReadStatusFix.updateMessageStatusInstantly(id, 'delivered'));
      }
    });
    
    socket.on('messageDelivered', (data) => {
      console.log('📬 SOCKET: messageDelivered', data);
      if (data.messageId) {
        instantReadStatusFix.updateMessageStatusInstantly(data.messageId, 'delivered');
      }
    });
    
    console.log('✅ Socket events hooked for instant updates');
  }
};

// Make available globally
window.instantReadStatusFix = instantReadStatusFix;
window.updateMessageStatusInstantly = instantReadStatusFix.updateMessageStatusInstantly;

// Auto-hook socket events when available
const checkSocket = () => {
  const socket = window.useAuthStore?.getState?.()?.socket;
  if (socket) {
    instantReadStatusFix.hookSocketEvents();
  } else {
    setTimeout(checkSocket, 1000);
  }
};
checkSocket();

console.log('✅ Instant read status fix auto-loaded');
    `;

    // Execute the script
    const script = document.createElement('script');
    script.textContent = instantFixScript;
    document.head.appendChild(script);
  }, 2000);
}

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
