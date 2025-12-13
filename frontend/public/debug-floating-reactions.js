
// ✅ FLOATING REACTIONS DEBUG HELPER
// Add this to browser console to debug floating reactions

window.debugFloatingReactions = function() {
  console.log('🔍 FLOATING REACTIONS DEBUG');
  console.log('='.repeat(40));
  
  // Check if CSS is loaded
  const testElement = document.createElement('div');
  testElement.className = 'animate-enhanced-float-reaction';
  document.body.appendChild(testElement);
  
  const computed = window.getComputedStyle(testElement);
  const hasAnimation = computed.animationName !== 'none';
  
  console.log('✅ CSS Animation Loaded:', hasAnimation);
  console.log('   Animation Name:', computed.animationName);
  console.log('   Animation Duration:', computed.animationDuration);
  
  document.body.removeChild(testElement);
  
  // Check for floating reactions overlay
  const overlay = document.querySelector('.floating-reactions-overlay');
  console.log('✅ Floating Overlay Found:', !!overlay);
  
  if (overlay) {
    const overlayStyles = window.getComputedStyle(overlay);
    console.log('   Overlay Position:', overlayStyles.position);
    console.log('   Overlay Z-Index:', overlayStyles.zIndex);
    console.log('   Overlay Visibility:', overlayStyles.visibility);
  }
  
  // Check for ChatMessage components
  const messages = document.querySelectorAll('[id^="message-"]');
  console.log('✅ Message Elements Found:', messages.length);
  
  // Test manual floating reaction
  if (messages.length > 0) {
    console.log('🧪 Testing manual floating reaction...');
    
    const testMessage = messages[0];
    const rect = testMessage.getBoundingClientRect();
    
    const floatingEmoji = document.createElement('div');
    floatingEmoji.innerHTML = '🧪';
    floatingEmoji.className = 'animate-enhanced-float-reaction';
    floatingEmoji.style.cssText = `
      position: fixed;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top + rect.height / 2}px;
      font-size: 2.5rem;
      pointer-events: none;
      z-index: 99999;
      transform: translate(-50%, -50%);
      font-family: Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif;
    `;
    
    document.body.appendChild(floatingEmoji);
    
    setTimeout(() => {
      if (floatingEmoji.parentNode) {
        floatingEmoji.parentNode.removeChild(floatingEmoji);
      }
    }, 3500);
    
    console.log('✅ Manual test reaction created');
  }
  
  console.log('');
  console.log('📋 INSTRUCTIONS:');
  console.log('1. Long press on any message');
  console.log('2. Select an emoji from the picker');
  console.log('3. Watch for floating animation');
  console.log('4. Check console for debug logs');
};

// Auto-run debug on load
setTimeout(() => {
  if (window.location.pathname.includes('/chat') || window.location.pathname === '/') {
    console.log('🔧 Floating Reactions Debug Helper Loaded');
    console.log('   Run debugFloatingReactions() to test');
  }
}, 2000);
