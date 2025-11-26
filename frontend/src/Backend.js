import axios from "axios";
import config from "./config";

// Create axios instance with default configuration
const api = axios.create({
  baseURL: config.SPRING_API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

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