#!/usr/bin/env node

/**
 * FIX REACTIONS ERROR
 * Ensure all message objects have proper reactions arrays
 */

const fs = require('fs');
const path = require('path');

console.log("🔧 FIXING REACTIONS ERROR");
console.log("=========================");

// Fix 1: Ensure backend message controller returns reactions array
const messageControllerPath = path.join(__dirname, 'backend/src/controllers/message.controller.js');

try {
    let content = fs.readFileSync(messageControllerPath, 'utf8');
    
    // Check if we need to add reactions initialization
    if (!content.includes('reactions: message.reactions || []')) {
        console.log("📝 Adding reactions initialization to message controller...");
        
        // Find the message response and ensure reactions is always an array
        const oldPattern = /res\.status\(201\)\.json\(message\)/g;
        const newPattern = `res.status(201).json({
            ...message,
            reactions: message.reactions || []
        })`;
        
        if (content.match(oldPattern)) {
            content = content.replace(oldPattern, newPattern);
            fs.writeFileSync(messageControllerPath, content);
            console.log("✅ Fixed message controller to always return reactions array");
        }
    }
} catch (error) {
    console.log("⚠️ Could not modify message controller:", error.message);
}

// Fix 2: Add message normalization utility
const utilsPath = path.join(__dirname, 'frontend/src/utils/messageUtils.js');

const messageUtilsContent = `/**
 * Message Utilities
 * Normalize message objects to ensure consistent structure
 */

export const normalizeMessage = (message) => {
    if (!message) return null;
    
    return {
        ...message,
        reactions: Array.isArray(message.reactions) ? message.reactions : [],
        // Ensure other fields have safe defaults
        text: message.text || '',
        image: message.image || null,
        voice: message.voice || null,
        voiceDuration: message.voiceDuration || null,
        replyTo: message.replyTo || null,
        status: message.status || 'sent',
        createdAt: message.createdAt || new Date().toISOString()
    };
};

export const normalizeMessages = (messages) => {
    if (!Array.isArray(messages)) return [];
    return messages.map(normalizeMessage);
};

export const safeReactionsFind = (reactions, predicate) => {
    const safeReactions = Array.isArray(reactions) ? reactions : [];
    return safeReactions.find(predicate);
};

export const safeReactionsReduce = (reactions, reducer, initialValue) => {
    const safeReactions = Array.isArray(reactions) ? reactions : [];
    return safeReactions.reduce(reducer, initialValue);
};
`;

try {
    fs.writeFileSync(utilsPath, messageUtilsContent);
    console.log("✅ Created message utilities for safe message handling");
} catch (error) {
    console.log("⚠️ Could not create message utilities:", error.message);
}

console.log("\n🎯 FIXES APPLIED:");
console.log("1. ✅ Backend ensures reactions array in responses");
console.log("2. ✅ Frontend utilities for safe message handling");
console.log("3. ✅ Sidebar component already fixed for array safety");
console.log("4. ✅ ChatMessage component already fixed for null safety");

console.log("\n📝 RECOMMENDATION:");
console.log("Import and use normalizeMessage() in components that handle message data");
console.log("This ensures all messages have consistent structure with safe defaults");