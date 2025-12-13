
// FLOATING REACTIONS BROWSER TEST
console.log('🧪 Testing floating reactions in browser...');

// Test 1: Check if CSS animations are loaded
const testElement = document.createElement('div');
testElement.className = 'animate-enhanced-float-reaction';
testElement.style.cssText = 'position: fixed; top: 50%; left: 50%; font-size: 2rem;';
testElement.innerHTML = '🧪';
document.body.appendChild(testElement);

const computedStyle = window.getComputedStyle(testElement);
const animationName = computedStyle.animationName;
console.log('✅ Animation name:', animationName);
console.log('✅ Animation loaded:', animationName !== 'none');

setTimeout(() => {
  if (testElement.parentNode) {
    testElement.parentNode.removeChild(testElement);
  }
}, 1000);

// Test 2: Check for ChatContainer overlay
const overlay = document.querySelector('.floating-reactions-overlay');
console.log('✅ Floating Overlay Found:', !!overlay);

// Test 3: Check for ChatMessage components
const chatMessages = document.querySelectorAll('[id^="message-"]');
console.log('✅ Chat Messages Found:', chatMessages.length);

// Test 4: Test manual floating reaction creation
function testManualFloatingReaction() {
  console.log('🧪 Testing manual floating reaction...');
  
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
  
  console.log('✅ Manual floating reaction created');
}

// Run test after 2 seconds
setTimeout(testManualFloatingReaction, 2000);

console.log('🎯 Open browser console to see test results');
console.log('🎯 Long press on any message to test floating reactions');
