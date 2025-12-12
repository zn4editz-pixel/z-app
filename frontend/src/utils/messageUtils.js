/**
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
