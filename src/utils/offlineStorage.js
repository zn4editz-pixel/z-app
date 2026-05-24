// Offline data caching utilities using localStorage

const CACHE_KEYS = {
  MESSAGES: 'z_app_messages_cache',
  USERS: 'z_app_users_cache',
  FRIENDS: 'z_app_friends_cache',
  PROFILE: 'z_app_profile_cache',
  LAST_SYNC: 'z_app_last_sync',
};

// Save data to cache
export const saveToCache = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to save to cache:', error);
  }
};

// Get data from cache
export const getFromCache = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    
    // Cache expires after 7 days
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > SEVEN_DAYS) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data;
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to get from cache:', error);
    return null;
  }
};

// Clear all cache
export const clearCache = () => {
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

// Cache messages for a specific user
export const cacheMessages = (userId, messages) => {
  const key = `${CACHE_KEYS.MESSAGES}_${userId}`;
  saveToCache(key, messages);
};

// Get cached messages for a specific user
export const getCachedMessages = (userId) => {
  const key = `${CACHE_KEYS.MESSAGES}_${userId}`;
  return getFromCache(key);
};

// Cache user list
export const cacheUsers = (users) => {
  saveToCache(CACHE_KEYS.USERS, users);
};

// Get cached users
export const getCachedUsers = () => {
  return getFromCache(CACHE_KEYS.USERS);
};

// Cache friends list
export const cacheFriends = (friends) => {
  saveToCache(CACHE_KEYS.FRIENDS, friends);
};

// Get cached friends
export const getCachedFriends = () => {
  return getFromCache(CACHE_KEYS.FRIENDS);
};

// Cache user profile
export const cacheProfile = (profile) => {
  saveToCache(CACHE_KEYS.PROFILE, profile);
};

// Get cached profile
export const getCachedProfile = () => {
  return getFromCache(CACHE_KEYS.PROFILE);
};

// Update last sync time
export const updateLastSync = () => {
  localStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
};

// Get last sync time
export const getLastSync = () => {
  const lastSync = localStorage.getItem(CACHE_KEYS.LAST_SYNC);
  return lastSync ? parseInt(lastSync) : null;
};

export default {
  saveToCache,
  getFromCache,
  clearCache,
  cacheMessages,
  getCachedMessages,
  cacheUsers,
  getCachedUsers,
  cacheFriends,
  getCachedFriends,
  cacheProfile,
  getCachedProfile,
  updateLastSync,
  getLastSync,
};
