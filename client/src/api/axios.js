import axios from 'axios';
import { TOKEN_KEYS } from '../constants/auth';

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// --- token helpers -------------------------------------------------------
export const getAccessToken = () => localStorage.getItem(TOKEN_KEYS.access);
export const getRefreshToken = () => localStorage.getItem(TOKEN_KEYS.refresh);
export const setTokens = ({ access, refresh }) => {
  if (access) localStorage.setItem(TOKEN_KEYS.access, access);
  if (refresh) localStorage.setItem(TOKEN_KEYS.refresh, refresh);
};
export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEYS.access);
  localStorage.removeItem(TOKEN_KEYS.refresh);
};

// --- Helper: accurately detect public endpoints ---------------------------
function isPublicUrl(url) {
  if (!url) return false;
  const path = url.split('?')[0]; // strip query parameters

  // Always treat these as protected (editor/admin only)
  if (path.includes('my_articles') || 
      path.includes('pending_review') || 
      path.includes('my-articles') ||
      path.includes('/admin/') ||
      path.includes('/editor/')) {
    return false;
  }

  // List of patterns that are truly public (read-only, no auth needed)
  const publicPatterns = [
    /^\/articles\/$/,                           
    /^\/articles\/[^\/]+\/$/,                   
    /^\/categories\/$/,                         
    /^\/categories\/[^\/]+\/$/,                 
    /^\/search\/$/,                             
    /^\/analytics\/feedbacks\/for_object\/$/,   
    /^\/analytics\/feedbacks\/stats\/$/,        
    /^\/analytics\/time-series\/$/,             
    /^\/stats\/$/,                              
  ];

  return publicPatterns.some(pattern => pattern.test(path));
}

// --- request interceptor: attach token only if NOT public ----------
api.interceptors.request.use((config) => {
  if (!isPublicUrl(config.url)) {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- response interceptor: auto-refresh on 401, but skip for public ---
let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
};


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/token');

    // If it's a public endpoint, never try to refresh or clear tokens
    if (isPublicUrl(originalRequest?.url)) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });
        setTokens({ access: data.access });
        processQueue(null, data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function redirectToLogin() {
  if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/editor')) {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
  }
}

export function extractErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return error?.message || 'Something went wrong. Please try again.';
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const val = data[firstKey];
    return Array.isArray(val) ? `${firstKey}: ${val[0]}` : String(val);
  }
  return 'Something went wrong. Please try again.';
}

export default api;