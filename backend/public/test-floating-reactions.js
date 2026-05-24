// ✅ FLOATING REACTIONS BROWSER TEST
// Paste this in browser console to test floating reactions
function testFloatingReactions() {
  );
  // Test 1: Check if CSS animation exists
  const testElement = document.createElement('div');
  testElement.className = 'animate-enhanced-float-reaction';
  document.body.appendChild(testElement);
  const computed = window.getComputedStyle(testElement);
  const hasAnimation = computed.animationName !== 'none';
  document.body.removeChild(testElement);
  // Test 2: Check for ChatContainer overlay
  const overlay = document.querySelector('.floating-reactions-overlay');
  if (overlay) {
    const overlayStyles = window.getComputedStyle(overlay);
  }
  // Test 3: Check for message elements
  const messages = document.querySelectorAll('[id^="message-"]');
  // Test 4: Create manual floating reaction
  if (messages.length > 0) {
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
  }
}
// Auto-run test
setTimeout(testFloatingReactions, 1000);
