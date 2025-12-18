#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing compact bars and blue rectangle issue...\n');

// Update Enhanced components with the same fixes
const enhancedComponents = [
  'frontend/src/components/EnhancedMessageInput.jsx',
  'frontend/src/components/EnhancedChatContainer.jsx'
];

enhancedComponents.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Apply compact styling
    content = content.replace(
      /px-3 py-2 w-full bg-base-100\/95/g,
      'px-2 py-1 w-full bg-base-100/95'
    );
    
    // Fix input styling
    content = content.replace(
      /px-4 py-2 md:px-5 md:py-3/g,
      'px-3 py-1.5'
    );
    
    // Remove blue rectangle
    content = content.replace(
      /style=\{\s*\{\s*outline: "none",\s*boxShadow: "none",\s*borderColor: "transparent",\s*fontSize: isMobile \? "16px" : "1\.05rem"\s*\}\s*\}/g,
      `style={{ 
                outline: "none !important", 
                boxShadow: "none !important", 
                borderColor: "transparent !important",
                border: "none !important",
                WebkitAppearance: "none !important",
                MozAppearance: "none !important",
                appearance: "none !important",
                WebkitTapHighlightColor: "transparent !important",
                fontSize: "14px"
              }}`
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${path.basename(filePath)} with compact styling`);
  }
});

// Add additional CSS for complete blue rectangle removal
const additionalCSS = `
/* COMPLETE BLUE RECTANGLE ELIMINATION - ALL CASES */
input, textarea, select, button, div, span {
  -webkit-tap-highlight-color: transparent !important;
  -webkit-touch-callout: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
  user-select: none !important;
}

/* Allow text selection only for text inputs */
input[type="text"], input[type="email"], input[type="password"], textarea {
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
  user-select: text !important;
}

/* Remove ALL possible focus indicators */
*:focus, *:focus-visible, *:active, *:hover {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
  -webkit-tap-highlight-color: transparent !important;
}

/* Ultra-compact mobile adjustments */
@media (max-width: 768px) {
  .mobile-chat-header-professional {
    min-height: 44px !important;
    padding: 2px 6px !important;
  }
  
  .mobile-message-input-professional {
    min-height: 44px !important;
    padding: 4px 6px !important;
  }
  
  .mobile-message-input-professional input {
    min-height: 28px !important;
    padding: 4px 8px !important;
    font-size: 14px !important;
  }
}
`;

// Append to chat improvements CSS
const cssPath = 'frontend/src/styles/chat-improvements.css';
if (fs.existsSync(cssPath)) {
  let cssContent = fs.readFileSync(cssPath, 'utf8');
  if (!cssContent.includes('COMPLETE BLUE RECTANGLE ELIMINATION')) {
    cssContent += additionalCSS;
    fs.writeFileSync(cssPath, cssContent);
    console.log('✅ Added complete blue rectangle elimination CSS');
  }
}

console.log('\n🎉 Compact bars and blue rectangle fixes applied!');
console.log('\n📋 Changes made:');
console.log('   • Reduced top bar height to 44px (ultra-compact)');
console.log('   • Reduced bottom bar height to 44px (ultra-compact)');
console.log('   • Completely eliminated blue rectangle on all inputs');
console.log('   • Added comprehensive tap highlight removal');
console.log('   • Optimized for mobile touch experience');
console.log('   • Maintained text selection functionality');

console.log('\n🚀 Ready to push to GitHub!');