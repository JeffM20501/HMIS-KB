import axios from "axios";
import { Import } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const DEBUG = import.meta.env.VITE_API_DEBUG === "true";

export const ACCESS_TOKEN_KEY = import.meta.env.ACCESS_TOKEN_KEY|| "healthkb_access";;
export const REFRESH_TOKEN_KEY = import.meta.env.VITE_REFRESH_TOKEN_KEY|| "healthkb_refresh";;

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = ({ access, refresh } = {}) => {
  if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const client = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (DEBUG) console.debug("[API request]", config.method?.toUpperCase(), config.url);
  return config;
});

function extractMessage(data) {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const val = data[firstKey];
    const text = Array.isArray(val) ? val[0] : val;
    return firstKey === "non_field_errors" ? text : `${firstKey}: ${text}`;
  }
  return "";
}

let isRefreshing = false;
let pendingQueue = [];

const flushQueue = (error, token) => {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  pendingQueue = [];
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (DEBUG) console.debug("[API error]", response?.status, config?.url);

    const isAuthEndpoint = config?.url?.includes("/auth/token/");

    if (response?.status === 401 && !config._retry && !isAuthEndpoint) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        window.dispatchEvent(new CustomEvent("healthkb:unauthorized"));
        return Promise.reject({ ...error, message: extractMessage(response?.data) || "Session expired." });
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          config._retry = true;
          config.headers.Authorization = `Bearer ${token}`;
          return client(config);
        });
      }

      config._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh: refreshToken });
        setTokens({ access: data.access, refresh: data.refresh ?? refreshToken });
        flushQueue(null, data.access);
        config.headers.Authorization = `Bearer ${data.access}`;
        return client(config);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        clearTokens();
        window.dispatchEvent(new CustomEvent("healthkb:unauthorized"));
        return Promise.reject({ ...error, message: "Your session has expired. Please sign in again." });
      } finally {
        isRefreshing = false;
      }
    }

    const message = extractMessage(response?.data) || error.message || "Something went wrong.";
    return Promise.reject({ ...error, message });
  }
);

export default client;