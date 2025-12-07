import axios from "axios";

// Get the base URL from the environment variable (e.g., https://z-om-backend-4bod.onrender.com)
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Check if the environment variable is set in production
if (!apiBaseUrl && import.meta.env.PROD) {
  console.error("VITE_API_BASE_URL is not defined in the environment!");
  // Consider throwing an error or setting a default that will clearly fail
}

export const axiosInstance = axios.create({
  baseURL: import.meta.env.PROD
    ? `${apiBaseUrl}/api`
    : "http://localhost:5001/api",
  withCredentials: true,
  timeout: 15000, // 15 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
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

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error("API Error:", {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
        url: error.config?.url
      });
    }
    
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
