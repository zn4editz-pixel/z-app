/**
 * Mobile Chat Enhancements
 * Handles mobile-specific chat behaviors including keyboard detection,
 * viewport adjustments, and UI optimizations
 */

import { useState, useEffect } from 'react';

export class MobileChatManager {
  constructor() {
    this.isMobile = false;
    this.keyboardVisible = false;
    this.listeners = new Set();
    this.callbacks = new Set();
    
    this.init();
  }

  init() {
    this.detectMobile();
    this.setupKeyboardDetection();
    this.setupViewportFixes();
    
    // Listen for resize events
    window.addEventListener('resize', this.detectMobile.bind(this));
  }

  detectMobile() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    
    if (wasMobile !== this.isMobile) {
      this.notifyCallbacks('mobileChange', this.isMobile);
    }
  }

  setupKeyboardDetection() {
    if (!this.isMobile) return;

    const handleViewportChange = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.screen.height;
      const keyboardThreshold = windowHeight * 0.75;
      
      const wasVisible = this.keyboardVisible;
      this.keyboardVisible = viewportHeight < keyboardThreshold;
      
      if (wasVisible !== this.keyboardVisible) {
        this.notifyCallbacks('keyboardChange', this.keyboardVisible);
        this.handleKeyboardChange();
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      this.listeners.add(() => 
        window.visualViewport.removeEventListener('resize', handleViewportChange)
      );
    } else {
      window.addEventListener('resize', handleViewportChange);
      this.listeners.add(() => 
        window.removeEventListener('resize', handleViewportChange)
      );
    }
  }

  setupViewportFixes() {
    if (!this.isMobile) return;

    // Prevent zoom on input focus
    const preventZoom = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        e.target.style.fontSize = '16px';
      }
    };

    document.addEventListener('focusin', preventZoom);
    this.listeners.add(() => 
      document.removeEventListener('focusin', preventZoom)
    );

    // Handle viewport meta tag
    this.updateViewportMeta();
  }

  updateViewportMeta() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
  }

  handleKeyboardChange() {
    // Add/remove body classes for keyboard state
    if (this.keyboardVisible) {
      document.body.classList.add('mobile-keyboard-visible');
    } else {
      document.body.classList.remove('mobile-keyboard-visible');
    }

    // Scroll to bottom of chat when keyboard appears
    if (this.keyboardVisible) {
      setTimeout(() => {
        const chatContainer = document.querySelector('[data-chat-container]');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    }
  }

  // Subscribe to mobile chat events
  subscribe(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  notifyCallbacks(event, data) {
    this.callbacks.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Mobile chat callback error:', error);
      }
    });
  }

  // Get current state
  getState() {
    return {
      isMobile: this.isMobile,
      keyboardVisible: this.keyboardVisible
    };
  }

  // Cleanup
  destroy() {
    this.listeners.forEach(cleanup => cleanup());
    this.listeners.clear();
    this.callbacks.clear();
    
    window.removeEventListener('resize', this.detectMobile.bind(this));
    document.body.classList.remove('mobile-keyboard-visible');
  }
}

// Singleton instance
let mobileChatManager = null;

export const getMobileChatManager = () => {
  if (!mobileChatManager) {
    mobileChatManager = new MobileChatManager();
  }
  return mobileChatManager;
};

export const destroyMobileChatManager = () => {
  if (mobileChatManager) {
    mobileChatManager.destroy();
    mobileChatManager = null;
  }
};

// React hook for mobile chat state
export const useMobileChat = () => {
  const [state, setState] = useState(() => 
    getMobileChatManager().getState()
  );

  useEffect(() => {
    const manager = getMobileChatManager();
    
    const unsubscribe = manager.subscribe((event, data) => {
      setState(manager.getState());
    });

    return unsubscribe;
  }, []);

  return state;
};

// Utility functions
export const isMobileDevice = () => {
  return window.innerWidth <= 768;
};

export const isKeyboardVisible = () => {
  if (!isMobileDevice()) return false;
  
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  const windowHeight = window.screen.height;
  return viewportHeight < windowHeight * 0.75;
};

export const optimizeForMobileChat = (element) => {
  if (!element || !isMobileDevice()) return;

  // Add mobile-optimized classes
  element.classList.add('mobile-chat-optimized');
  
  // Prevent overscroll
  element.style.overscrollBehavior = 'contain';
  element.style.webkitOverflowScrolling = 'touch';
  
  // Optimize touch interactions
  element.style.touchAction = 'pan-y';
};