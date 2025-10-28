import axios from "axios";
import config from "./config";

const URL = config.SPRING_API_BASE + "/";


class Backend {
  static async get(path, body = null, params = null) {
    let url = URL + path.replace(/^\//, "");
    if (params) {
      let data = new URLSearchParams();
      for (const p in params) {
        data.append(p, params[p]);
      }
      url += '?';
      url += data.toString();
    }
    const options = {
      method: "GET",
      url,
      headers: { "Content-Type": "application/json" },
    };
    if (body) options.data = JSON.stringify(body);
    const response = await axios(options);
    return response;
  }

  static async post(path, body = null, params = null) {
    let url = URL + path.replace(/^\//, "");
    if (params) {
      let data = new URLSearchParams();
      for (const p in params) {
        data.append(p, params[p]);
      }
      url += '?';
      url += data.toString();
    }
    const response = await axios.post(url, body ? JSON.stringify(body) : null, {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  }

  static async put(path, body = null, params = null) {
    let url = URL + path.replace(/^\//, "");
    if (params) {
      let data = new URLSearchParams();
      for (const p in params) {
        data.append(p, params[p]);
      }
      url += '?';
      url += data.toString();
    }
    const response = await axios.put(url, body ? JSON.stringify(body) : null, {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  }

  static async delete(path, params = null) {
    let url = URL + path.replace(/^\//, "");
    if (params) {
      let data = new URLSearchParams();
      for (const p in params) {
        data.append(p, params[p]);
      }
      url += '?';
      url += data.toString();
    }
    const response = await axios.delete(url, {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  }
}

export default Backend; 