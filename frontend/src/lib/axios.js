import axios from "axios";

// Production-ready API URL configuration
const getApiBaseUrl = () => {
  // Development
  if (import.meta.env.MODE === "development") {
    return "http://localhost:5001";
  }
  
  // Production - use environment variable
  const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl;
  }
  
  // Fallback to current domain
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}`;
};

const apiBaseUrl = getApiBaseUrl();

// Simple in-memory cache for GET requests
const apiCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

export const axiosInstance = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  timeout: 10000, // 10 second timeout (faster)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token and handle caching
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check cache for GET requests (optional, can be disabled per request)
    if (config.method === 'get' && config.cache !== false) {
      const cacheKey = config.url + JSON.stringify(config.params || {});
      const cached = apiCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        config.adapter = () => Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK (cached)',
          headers: {},
          config,
        });
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get' && response.config.cache !== false) {
      const cacheKey = response.config.url + JSON.stringify(response.config.params || {});
      apiCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const errorMessage = error.response?.data?.message || error.response?.data?.error || '';

      const isAuthFailure =
        url.includes('/auth/check') ||
        errorMessage.toLowerCase().includes('invalid') ||
        errorMessage.toLowerCase().includes('expired') ||
        errorMessage.toLowerCase().includes('no token');

      if (isAuthFailure) {
        localStorage.removeItem("token");
        localStorage.removeItem("authUser");

        if (!window.location.pathname.includes('/login')) {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

// Utility to clear cache
export const clearApiCache = () => apiCache.clear();

// Utility to invalidate specific cache
export const invalidateCache = (urlPattern) => {
  for (const key of apiCache.keys()) {
    if (key.includes(urlPattern)) {
      apiCache.delete(key);
    }
  }
};

