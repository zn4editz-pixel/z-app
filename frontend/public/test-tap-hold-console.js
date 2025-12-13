
// TAP AND HOLD FLOATING REACTIONS CONSOLE TEST
console.log('🧪 Testing tap and hold floating reactions...');

// Test 1: Check if we're in a chat page
const chatContainer = document.querySelector('[class*="ChatContainer"]') || 
                     document.querySelector('.flex-1.flex.flex-col.h-full.w-full');
console.log('✅ Chat container found:', !!chatContainer);

// Test 2: Check for message elements
const messages = document.querySelectorAll('[id^="message-"]');
console.log('✅ Messages found:', messages.length);

// Test 3: Check for floating reactions overlay
const overlay = document.querySelector('.floating-reactions-overlay');
console.log('✅ Floating overlay found:', !!overlay);

// Test 4: Check CSS animations
const testElement = document.createElement('div');
testElement.className = 'animate-enhanced-float-reaction';
testElement.style.cssText = 'position: fixed; opacity: 0; pointer-events: none;';
document.body.appendChild(testElement);

const computedStyle = window.getComputedStyle(testElement);
const animationName = computedStyle.animationName;
console.log('✅ CSS animation loaded:', animationName !== 'none');
console.log('✅ Animation name:', animationName);

document.body.removeChild(testElement);

// Test 5: Check for touch event handlers
if (messages.length > 0) {
  const firstMessage = messages[0];
  const hasTouch = firstMessage.ontouchstart !== undefined;
  console.log('✅ Touch events supported:', hasTouch);
  
  // Check for message bubble
  const messageBubble = firstMessage.querySelector('.message-bubble-container');
  console.log('✅ Message bubble found:', !!messageBubble);
}

// Test 6: Manual floating reaction test
function testManualFloating() {
  console.log('🧪 Testing manual floating reaction...');
  
  if (typeof window.testChatContainerFloating === 'function') {
    window.testChatContainerFloating('🧪');
    console.log('✅ ChatContainer test function called');
  } else {
    console.log('❌ ChatContainer test function not found');
  }
  
  if (typeof window.testFloatingReaction === 'function') {
    window.testFloatingReaction('🧪');
    console.log('✅ ChatMessage test function called');
  } else {
    console.log('❌ ChatMessage test function not found');
  }
}

// Test 7: Simulate long press on first message
function simulateLongPress() {
  if (messages.length > 0) {
    const firstMessage = messages[0];
    const messageBubble = firstMessage.querySelector('.message-bubble-container') || firstMessage;
    
    console.log('🧪 Simulating long press on first message...');
    
    // Create touch events
    const touchStart = new TouchEvent('touchstart', {
      touches: [{
        clientX: 100,
        clientY: 100,
        target: messageBubble
      }],
      bubbles: true,
      cancelable: true
    });
    
    const touchEnd = new TouchEvent('touchend', {
      touches: [],
      bubbles: true,
      cancelable: true
    });
    
    messageBubble.dispatchEvent(touchStart);
    
    setTimeout(() => {
      messageBubble.dispatchEvent(touchEnd);
      console.log('✅ Long press simulation completed');
    }, 600); // Longer than 500ms threshold
  }
}

// Run tests
setTimeout(testManualFloating, 1000);
setTimeout(simulateLongPress, 2000);

console.log('🎯 Check the console for test results');
console.log('🎯 Try long pressing on a message manually');
