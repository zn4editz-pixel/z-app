import axios from "axios";

// Get the base URL from the environment variable (e.g., https://z-om-backend-4bod.onrender.com)
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Check if the environment variable is set in production
if (!apiBaseUrl && import.meta.env.PROD) {
  console.error("VITE_API_BASE_URL is not defined in the environment!");
  // Consider throwing an error or setting a default that will clearly fail
}

export const axiosInstance = axios.create({
  // Use the environment variable + /api for production, fallback to localhost for development
  baseURL: import.meta.env.PROD
    ? `${apiBaseUrl}/api` // ✅ ADDED /api prefix here
    : "http://localhost:5001/api", // Development URL already includes /api
  withCredentials: true, // Send cookies with requests
});

// Add request interceptor to include token in all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response, // Simply return successful responses
  (error) => {
    // Log detailed error information
    console.error("API Error:", {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
        url: error.config?.url
    });
    
    // Handle 401 Unauthorized - but be smart about it
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const errorMessage = error.response?.data?.message || error.response?.data?.error || '';
      
      // Only auto-logout for ACTUAL auth failures, not permission issues
      const isAuthFailure = 
        url.includes('/auth/check') || 
        errorMessage.toLowerCase().includes('invalid') ||
        errorMessage.toLowerCase().includes('expired') ||
        errorMessage.toLowerCase().includes('no token');
      
      if (isAuthFailure) {
        console.log("Auth token invalid or expired, logging out");
        localStorage.removeItem("token");
        localStorage.removeItem("authUser");
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = "/login";
        }
      }
      // For other 401s (like admin routes, permission issues), just reject without auto-logout
    }
    
    // Reject the promise so downstream `.catch()` blocks can handle it
    return Promise.reject(error);
  }
);
