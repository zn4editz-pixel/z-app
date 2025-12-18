#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Updating Chat UI with Instagram-level improvements...\n');

// 1. Update main CSS file to include improvements
const indexCssPath = 'frontend/src/index.css';
const chatImprovementsCss = fs.readFileSync('frontend/src/styles/chat-improvements.css', 'utf8');

if (fs.existsSync(indexCssPath)) {
  let indexCss = fs.readFileSync(indexCssPath, 'utf8');
  
  // Add import for chat improvements if not already present
  if (!indexCss.includes("@import './styles/chat-improvements.css'")) {
    indexCss = `/* Import chat improvements */\n@import './styles/chat-improvements.css';\n\n${indexCss}`;
    fs.writeFileSync(indexCssPath, indexCss);
    console.log('✅ Added chat improvements import to index.css');
  }
}

// 2. Update ChatContainer to use enhanced version
const chatContainerPath = 'frontend/src/components/ChatContainer.jsx';
const enhancedChatContainerPath = 'frontend/src/components/EnhancedChatContainer.jsx';

if (fs.existsSync(chatContainerPath) && fs.existsSync(enhancedChatContainerPath)) {
  // Backup original
  fs.copyFileSync(chatContainerPath, `${chatContainerPath}.backup`);
  
  // Replace with enhanced version
  const enhancedContent = fs.readFileSync(enhancedChatContainerPath, 'utf8');
  fs.writeFileSync(chatContainerPath, enhancedContent);
  console.log('✅ Updated ChatContainer with enhanced version');
}

// 3. Update MessageInput to use enhanced version
const messageInputPath = 'frontend/src/components/MessageInput.jsx';
const enhancedMessageInputPath = 'frontend/src/components/EnhancedMessageInput.jsx';

if (fs.existsSync(messageInputPath) && fs.existsSync(enhancedMessageInputPath)) {
  // Backup original
  fs.copyFileSync(messageInputPath, `${messageInputPath}.backup`);
  
  // Replace with enhanced version
  const enhancedContent = fs.readFileSync(enhancedMessageInputPath, 'utf8');
  fs.writeFileSync(messageInputPath, enhancedContent);
  console.log('✅ Updated MessageInput with enhanced version');
}

// 4. Update ChatMessage to use enhanced version
const chatMessagePath = 'frontend/src/components/ChatMessage.jsx';
const enhancedChatMessagePath = 'frontend/src/components/EnhancedChatMessage.jsx';

if (fs.existsSync(chatMessagePath) && fs.existsSync(enhancedChatMessagePath)) {
  // Backup original
  fs.copyFileSync(chatMessagePath, `${chatMessagePath}.backup`);
  
  // Replace with enhanced version
  const enhancedContent = fs.readFileSync(enhancedChatMessagePath, 'utf8');
  fs.writeFileSync(chatMessagePath, enhancedContent);
  console.log('✅ Updated ChatMessage with enhanced version');
}

// 5. Update useChatStore to support infinite scrolling
const chatStorePath = 'frontend/src/store/useChatStore.js';
if (fs.existsSync(chatStorePath)) {
  let storeContent = fs.readFileSync(chatStorePath, 'utf8');
  
  // Add hasMoreMessages state if not present
  if (!storeContent.includes('hasMoreMessages:')) {
    storeContent = storeContent.replace(
      'messages: [],',
      'messages: [],\n  hasMoreMessages: true,'
    );
  }
  
  // Add loadMoreMessages function if not present
  if (!storeContent.includes('loadMoreMessages:')) {
    const loadMoreFunction = `
  loadMoreMessages: async (userId) => {
    const { messages } = get();
    if (messages.length === 0) return;
    
    try {
      const oldestMessage = messages[0];
      const response = await axiosInstance.get(\`/messages/\${userId}\`, {
        params: {
          before: oldestMessage.createdAt,
          limit: 50
        }
      });
      
      const olderMessages = response.data;
      if (olderMessages.length > 0) {
        set((state) => ({
          messages: [...olderMessages, ...state.messages],
          hasMoreMessages: olderMessages.length === 50
        }));
      } else {
        set({ hasMoreMessages: false });
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
      set({ hasMoreMessages: false });
    }
  },`;
    
    storeContent = storeContent.replace(
      'getMessages: async (userId) => {',
      `loadMoreMessages: async (userId) => {
    const { messages } = get();
    if (messages.length === 0) return;
    
    try {
      const oldestMessage = messages[0];
      const response = await axiosInstance.get(\`/messages/\${userId}\`, {
        params: {
          before: oldestMessage.createdAt,
          limit: 50
        }
      });
      
      const olderMessages = response.data;
      if (olderMessages.length > 0) {
        set((state) => ({
          messages: [...olderMessages, ...state.messages],
          hasMoreMessages: olderMessages.length === 50
        }));
      } else {
        set({ hasMoreMessages: false });
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
      set({ hasMoreMessages: false });
    }
  },

  getMessages: async (userId) => {`
    );
  }
  
  fs.writeFileSync(chatStorePath, storeContent);
  console.log('✅ Updated useChatStore with infinite scrolling support');
}

// 6. Create performance optimization file
const performanceOptPath = 'frontend/src/utils/chatPerformance.js';
const performanceContent = `// Chat Performance Optimizations
export const optimizeScrolling = (container) => {
  if (!container) return;
  
  // Enable hardware acceleration
  container.style.transform = 'translateZ(0)';
  container.style.willChange = 'scroll-position';
  container.style.backfaceVisibility = 'hidden';
  
  // Optimize for touch devices
  container.style.WebkitOverflowScrolling = 'touch';
  container.style.overscrollBehavior = 'contain';
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const isElementInViewport = (el) => {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

export const smoothScrollTo = (element, to, duration = 300) => {
  const start = element.scrollTop;
  const change = to - start;
  const startTime = performance.now();
  
  const animateScroll = (currentTime) => {
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    
    // Easing function
    const easeInOutQuad = progress < 0.5 
      ? 2 * progress * progress 
      : -1 + (4 - 2 * progress) * progress;
    
    element.scrollTop = start + change * easeInOutQuad;
    
    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  };
  
  requestAnimationFrame(animateScroll);
};
`;

fs.writeFileSync(performanceOptPath, performanceContent);
console.log('✅ Created chat performance optimization utilities');

console.log('\n🎉 Chat UI improvements completed successfully!');
console.log('\n📋 Summary of improvements:');
console.log('   • Reduced chat bar and header heights');
console.log('   • Instagram-style infinite scrolling');
console.log('   • Fixed blue rectangle typing issue');
console.log('   • Enhanced mobile touch interactions');
console.log('   • Improved reaction emoji system');
console.log('   • Faster chat loading and transitions');
console.log('   • Better mobile keyboard handling');
console.log('   • Performance optimizations');

console.log('\n🚀 Ready to push to GitHub!');
console.log('\nRun these commands to deploy:');
console.log('   git add .');
console.log('   git commit -m "feat: Instagram-level chat UI improvements"');
console.log('   git push origin main');