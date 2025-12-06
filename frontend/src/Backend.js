import axios from "axios";
import config from "./config";

// Create axios instance with default configuration
const api = axios.create({
  baseURL: config.SPRING_API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

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