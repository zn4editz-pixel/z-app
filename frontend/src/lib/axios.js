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
        response: error.response?.data
    });
    
    // Handle 401 Unauthorized - but only for auth-related endpoints
    // Don't auto-logout for other 401s (like accessing admin routes without permission)
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      
      // Only auto-logout for auth check failures, not for permission issues
      if (url.includes('/auth/check') || url.includes('/auth/login') || url.includes('/auth/signup')) {
        console.log("Auth token invalid, logging out");
        localStorage.removeItem("token");
        localStorage.removeItem("authUser");
        window.location.href = "/login";
      }
      // For other 401s (like admin routes), just reject without auto-logout
    }
    
    // Reject the promise so downstream `.catch()` blocks can handle it
    return Promise.reject(error);
  }
);
