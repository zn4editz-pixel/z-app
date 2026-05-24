// FLOATING REACTIONS BROWSER TEST
// Test 1: Check if CSS animations are loaded
const testElement = document.createElement('div');
testElement.className = 'animate-enhanced-float-reaction';
testElement.style.cssText = 'position: fixed; top: 50%; left: 50%; font-size: 2rem;';
testElement.innerHTML = '🧪';
document.body.appendChild(testElement);
const computedStyle = window.getComputedStyle(testElement);
const animationName = computedStyle.animationName;
setTimeout(() => {
  if (testElement.parentNode) {
    testElement.parentNode.removeChild(testElement);
  }
}, 1000);
// Test 2: Check for ChatContainer overlay
const overlay = document.querySelector('.floating-reactions-overlay');
// Test 3: Check for ChatMessage components
const chatMessages = document.querySelectorAll('[id^="message-"]');
// Test 4: Test manual floating reaction creation
function testManualFloatingReaction() {
  const floatingEmoji = document.createElement('div');
  floatingEmoji.innerHTML = '🧪';
  floatingEmoji.className = 'animate-enhanced-float-reaction';
  floatingEmoji.style.cssText = `
    position: fixed;
    left: 50%;
    top: 50%;
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
// Run test after 2 seconds
setTimeout(testManualFloatingReaction, 2000);
