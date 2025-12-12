#!/usr/bin/env node

/**
 * IMMEDIATE MESSAGE SENDING FIX
 * Force API fallback to ensure messages work
 */

const fs = require('fs');
const path = require('path');

console.log("🔧 IMMEDIATE MESSAGE SENDING FIX");
console.log("================================");

const chatStorePath = path.join(__dirname, 'frontend/src/store/useChatStore.js');

try {
    // Read the current chat store
    let content = fs.readFileSync(chatStorePath, 'utf8');
    
    console.log("📖 Reading chat store...");
    
    // Find the sendMessage function and force API usage
    const oldSocketLogic = `        if (socket && socket.connected) {
            console.log('📤 Sending via Socket.IO (INSTANT)');
            
            // Emit via socket for instant delivery (NO AWAIT - fire and forget)
            socket.emit('sendMessage', {
                receiverId: selectedUser.id,
                ...messageData,
                tempId: tempId
            });
            
            // Socket will emit back with the real message to replace optimistic one
        } else {
            // Fallback to API only if socket not available (also fire and forget)
            console.log('📤 Sending via API (fallback)');`;
    
    const newApiLogic = `        // 🔧 TEMPORARY FIX: Force API usage for reliable message sending
        console.log('📤 Sending via API (FORCED - ensuring reliability)');
        
        // Always use API for now to ensure messages work
        {`;
    
    if (content.includes(oldSocketLogic)) {
        content = content.replace(oldSocketLogic, newApiLogic);
        
        // Write the fixed content
        fs.writeFileSync(chatStorePath, content);
        
        console.log("✅ Applied immediate fix to chat store");
        console.log("🔧 Messages will now use API directly (bypassing socket issues)");
        console.log("📝 This ensures reliable message sending while we debug socket issues");
        
        console.log("\n🎯 NEXT STEPS:");
        console.log("1. Test message sending in the browser");
        console.log("2. Go to http://localhost:5173/message-diagnostic to run diagnostics");
        console.log("3. Try sending messages in the chat");
        
    } else {
        console.log("⚠️ Could not find the exact code pattern to replace");
        console.log("The chat store might have been modified already");
    }
    
} catch (error) {
    console.error("❌ Fix failed:", error.message);
}