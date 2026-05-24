// ✅ SIMPLE FLOATING REACTIONS TEST
// Paste this in browser console to test
window.testSimpleFloatingReactions = function() {
  );
  // Create test floating reactions
  const emojis = ['❤️', '😂', '👍', '😮', '😢', '🔥'];
  emojis.forEach((emoji, index) => {
    setTimeout(() => {
      const floatingEmoji = document.createElement('div');
      floatingEmoji.innerHTML = emoji;
      floatingEmoji.style.cssText = `
        position: fixed;
        left: ${200 + index * 100}px;
        top: 300px;
        font-size: 3rem;
        pointer-events: none;
        z-index: 99999;
        transform: translate(-50%, -50%);
        font-family: Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif;
      `;
      // Add animation
      floatingEmoji.style.animation = 'simpleFloatUp 2s ease-out forwards';
      document.body.appendChild(floatingEmoji);
      setTimeout(() => {
        if (floatingEmoji.parentNode) {
          floatingEmoji.parentNode.removeChild(floatingEmoji);
        }
      }, 2500);
    }, index * 200);
  });
};
');
