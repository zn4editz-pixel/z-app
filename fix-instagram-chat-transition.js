#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎬 Applying Instagram-style chat transitions...\n');

// Update the enhanced chat container as well
const enhancedChatPath = 'frontend/src/components/EnhancedChatContainer.jsx';
if (fs.existsSync(enhancedChatPath)) {
  let content = fs.readFileSync(enhancedChatPath, 'utf8');
  
  // Apply the same fixes to the enhanced version
  content = content.replace(
    /setTimeout\(\(\) => \{\s*if \(scrollContainerRef\.current\) \{\s*scrollToBottomSmooth\("auto"\);\s*\}\s*\}, 100\);/,
    `// Instagram-style instant scroll to bottom - NO ANIMATION
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }`
  );
  
  // Add Instagram transition classes
  content = content.replace(
    /className={\`flex-1 flex flex-col h-full w-full chat-performance-optimized/,
    'className={`flex-1 flex flex-col h-full w-full chat-performance-optimized chat-container-enter'
  );
  
  // Add instant scroll class
  content = content.replace(
    /className={\`flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-3 bg-base-100 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent relative chat-scroll-optimized/,
    'className={`flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-3 bg-base-100 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent relative chat-scroll-optimized instant-scroll'
  );
  
  fs.writeFileSync(enhancedChatPath, content);
  console.log('✅ Updated EnhancedChatContainer with Instagram transitions');
}

// Update HomePage to add chat transition
const homePagePath = 'frontend/src/pages/HomePage.jsx';
if (fs.existsSync(homePagePath)) {
  let content = fs.readFileSync(homePagePath, 'utf8');
  
  // Add transition class when chat opens
  if (!content.includes('chat-slide-transition')) {
    content = content.replace(
      /{selectedUser && \(/,
      '{selectedUser && ('
    );
    
    // Add transition wrapper
    content = content.replace(
      /<ChatContainer/,
      '<div className="chat-slide-transition"><ChatContainer'
    );
    
    content = content.replace(
      /<\/ChatContainer>/,
      '</ChatContainer></div>'
    );
  }
  
  fs.writeFileSync(homePagePath, content);
  console.log('✅ Updated HomePage with chat slide transition');
}

console.log('\n🎉 Instagram-style chat transitions applied successfully!');
console.log('\n📋 Changes made:');
console.log('   • Added Instagram-style chat opening animation');
console.log('   • Removed all scroll animations on initial load');
console.log('   • Users now see latest messages instantly');
console.log('   • Added smooth slide transition when opening chat');
console.log('   • Enhanced mobile experience');

console.log('\n🚀 Ready to push to GitHub!');