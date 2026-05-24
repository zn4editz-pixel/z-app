
// ✅ FLOATING REACTIONS BROWSER TEST
// Paste this in browser console to test floating reactions

function testFloatingReactions() {
  console.log('🧪 Testing Floating Reactions System');
  console.log('='.repeat(40));
  
  // Test 1: Check if CSS animation exists
  const testElement = document.createElement('div');
  testElement.className = 'animate-enhanced-float-reaction';
  document.body.appendChild(testElement);
  
  const computed = window.getComputedStyle(testElement);
  const hasAnimation = computed.animationName !== 'none';
  
  console.log('✅ CSS Animation Available:', hasAnimation);
  console.log('   Animation Name:', computed.animationName);
  console.log('   Animation Duration:', computed.animationDuration);
  
  document.body.removeChild(testElement);
  
  // Test 2: Check for ChatContainer overlay
  const overlay = document.querySelector('.floating-reactions-overlay');
  console.log('✅ Floating Overlay Found:', !!overlay);
  
  if (overlay) {
    const overlayStyles = window.getComputedStyle(overlay);
    console.log('   Overlay Position:', overlayStyles.position);
    console.log('   Overlay Z-Index:', overlayStyles.zIndex);
  }
  
  // Test 3: Check for message elements
  const messages = document.querySelectorAll('[id^="message-"]');
  console.log('✅ Message Elements Found:', messages.length);
  
  // Test 4: Create manual floating reaction
  if (messages.length > 0) {
    console.log('🎨 Creating test floating reaction...');
    
    const message = messages[0];
    const rect = message.getBoundingClientRect();
    
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
    
    console.log('✅ Test reaction created - watch for floating emoji!');
  }
  
  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('1. Long press on any message');
  console.log('2. Select an emoji from picker');
  console.log('3. Watch for floating animation');
  console.log('4. Check console for debug logs');
}

// Auto-run test
setTimeout(testFloatingReactions, 1000);
