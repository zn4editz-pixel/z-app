// IndexedDB Cache Utility for Fast Data Loading
const DB_NAME = 'zapp-cache';
const DB_VERSION = 1;

let dbInstance = null;

export const openDB = () => {
  if (dbInstance) return Promise.resolve(dbInstance);
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('friends')) {
        db.createObjectStore('friends', { keyPath: 'userId' });
      }
      if (!db.objectStoreNames.contains('messages')) {
        db.createObjectStore('messages', { keyPath: 'chatId' });
      }
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'userId' });
      }
    };
  });
};

// Friends Cache
export const cacheFriends = async (userId, data) => {
  try {
    if (!userId || !data) {
      return;
    }
    const db = await openDB();
    const tx = db.transaction('friends', 'readwrite');
    await tx.objectStore('friends').put({
      userId,
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to cache friends:', error);
  }
};

export const getCachedFriends = async (userId) => {
  try {
    if (!userId) {
      return null;
    }
    const db = await openDB();
    const tx = db.transaction('friends', 'readonly');
    const cached = await tx.objectStore('friends').get(userId);
    
    // Return if less than 5 minutes old
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }
    return null;
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to get cached friends:', error);
    return null;
  }
};

// Messages Cache (enhanced version of existing offlineStorage)
export const cacheMessagesDB = async (chatId, messages) => {
  try {
    const db = await openDB();
    const tx = db.transaction('messages', 'readwrite');
    await tx.objectStore('messages').put({
      chatId,
      messages,
      timestamp: Date.now()
    });
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to cache messages:', error);
  }
};

export const getCachedMessagesDB = async (chatId) => {
  try {
    const db = await openDB();
    const tx = db.transaction('messages', 'readonly');
    const cached = await tx.objectStore('messages').get(chatId);
    
    // Return if less than 10 minutes old
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
      return cached.messages;
    }
    return null;
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to get cached messages:', error);
    return null;
  }
};

// User Data Cache
export const cacheUser = async (userId, userData) => {
  try {
    const db = await openDB();
    const tx = db.transaction('users', 'readwrite');
    await tx.objectStore('users').put({
      userId,
      userData,
      timestamp: Date.now()
    });
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to cache user:', error);
  }
};

export const getCachedUser = async (userId) => {
  try {
    const db = await openDB();
    const tx = db.transaction('users', 'readonly');
    const cached = await tx.objectStore('users').get(userId);
    
    // Return if less than 15 minutes old
    if (cached && Date.now() - cached.timestamp < 15 * 60 * 1000) {
      return cached.userData;
    }
    return null;
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to get cached user:', error);
    return null;
  }
};

// Clear all cache
export const clearCache = async () => {
  try {
    const db = await openDB();
    const stores = ['friends', 'messages', 'users'];
    
    for (const store of stores) {
      const tx = db.transaction(store, 'readwrite');
      await tx.objectStore(store).clear();
    }
    
    if (import.meta.env.DEV) console.log('✅ Cache cleared');
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to clear cache:', error);
  }
};

// Clear old cache entries (older than 1 hour)
export const cleanOldCache = async () => {
  try {
    const db = await openDB();
    const stores = ['friends', 'messages', 'users'];
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const store of stores) {
      const tx = db.transaction(store, 'readwrite');
      const objectStore = tx.objectStore(store);
      const request = objectStore.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.timestamp < oneHourAgo) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to clean old cache:', error);
  }
};

// Initialize cache cleanup on app start
if (typeof window !== 'undefined') {
  // Clean old cache every 30 minutes
  setInterval(cleanOldCache, 30 * 60 * 1000);
}
