// mobile/src/lib/apiClient.js
import axios from 'axios';
import { API_BASE } from '../config';
import { getAccessToken, setAccessToken, getRefreshToken, clearTokens } from './tokenStore';

// Render's free tier can take ~a minute to wake up, so the timeout is generous.
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'x-client': 'mobile' },
});

let authFailureHandler = null;
export function setAuthFailureHandler(fn) {
  authFailureHandler = fn;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// One shared refresh, so several requests failing at once don't each trigger their own
let refreshPromise = null;
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token stored');
      const { data } = await axios.post(
        `${API_BASE}/auth/refresh`,
        { refreshToken },
        { timeout: 60000, headers: { 'x-client': 'mobile' } }
      );
      setAccessToken(data.accessToken);
      return data.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const url = original?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch {
        await clearTokens();
        authFailureHandler?.();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;