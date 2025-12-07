import axios from "axios";
import config from "./config";

// Validate and ensure API base URL is absolute
let apiBaseUrl = config.SPRING_API_BASE;
if (!apiBaseUrl) {
  console.error("SPRING_API_BASE is not configured!");
  apiBaseUrl = "https://rewixx-backend.wittygrass-81d5c888.eastus2.azurecontainerapps.io";
}

// Ensure baseURL is absolute (starts with http:// or https://)
if (!apiBaseUrl.startsWith('http://') && !apiBaseUrl.startsWith('https://')) {
  console.warn("API base URL is relative, converting to absolute:", apiBaseUrl);
  apiBaseUrl = window.location.origin + (apiBaseUrl.startsWith('/') ? '' : '/') + apiBaseUrl;
}

// Warn if baseURL matches current origin (would cause relative URL issues)
if (apiBaseUrl === window.location.origin || apiBaseUrl.startsWith(window.location.origin + '/')) {
  console.error("API base URL matches current origin - this will cause relative URL issues!");
  console.error("API Base URL:", apiBaseUrl);
  console.error("Current Origin:", window.location.origin);
}

// Create axios instance with default configuration
const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to validate URLs and log for debugging
api.interceptors.request.use(
  (request) => {
    // Ensure the final URL is absolute
    const fullUrl = request.baseURL 
      ? (request.baseURL.endsWith('/') ? request.baseURL.slice(0, -1) : request.baseURL) + 
        (request.url.startsWith('/') ? request.url : '/' + request.url)
      : request.url;
    
    // Check if URL is relative (doesn't start with http)
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      console.error("Relative URL detected in API request!", {
        baseURL: request.baseURL,
        url: request.url,
        fullUrl: fullUrl
      });
    }
    
    // Warn if request is going to static site instead of API
    if (fullUrl.includes(window.location.origin) && !fullUrl.includes('/api/')) {
      console.warn("API request appears to be going to static site:", fullUrl);
    }
    
    return request;
  },
  (error) => Promise.reject(error)
);

// Attach JWT token from localStorage if available
api.interceptors.request.use(
  (request) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
      console.log("Request with token:", request.url, "Token present:", !!token);
    } else {
      console.warn("No token found in localStorage for request:", request.url);
    }
    return request;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("401 Unauthorized - Token may be invalid or expired");
      console.error("Request URL:", error.config?.url);
      console.error("Token in localStorage:", !!localStorage.getItem("auth_token"));
      // Optionally clear token and redirect to login
      const token = localStorage.getItem("auth_token");
      if (token) {
        console.error("Token exists but is invalid. Clearing...");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_email");
        localStorage.removeItem("auth_name");
        localStorage.removeItem("auth_avatar");
        // Reload to trigger login screen
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

class Backend {
  /**
   * Helper method to build URL with query parameters
   */
  static buildUrl(path, params = null) {
    // Ensure path doesn't start with / to avoid relative URL issues
    // Services already provide paths like "api/users/customers/list"
    let url = path.replace(/^\//, "");
    
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }
    return url;
  }

  static async get(path, params = null) {
    try {
      const url = this.buildUrl(path, params);
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("GET Error:", error);
      throw error;
    }
  }

  static async post(path, body = null, params = null) {
    try {
      const url = this.buildUrl(path, params);
      const response = await api.post(url, body);
      return response.data;
    } catch (error) {
      console.error("POST Error:", error);
      throw error;
    }
  }

  static async put(path, body = null, params = null) {
    try {
      const url = this.buildUrl(path, params);
      const response = await api.put(url, body);
      return response.data;
    } catch (error) {
      console.error("PUT Error:", error);
      throw error;
    }
  }

  static async delete(path, params = null) {
    try {
      const url = this.buildUrl(path, params);
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      console.error("DELETE Error:", error);
      throw error;
    }
  }
}

export default Backend;