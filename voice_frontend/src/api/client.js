/**
 * Axios instance for VoiceVerse API.
 * - Attaches Bearer token from in-memory store on every request.
 * - Auto-refreshes on 401 using the sessionStorage refresh token.
 * - Redirects to /login if refresh fails.
 */
import axios from 'axios';
import { tokenStore } from './tokenStore';

const BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach Bearer token ──────────────────────────
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: auto-refresh on 401 ────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const rt = localStorage.getItem('vv_rt');
      if (rt) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
            refresh_token: rt,
          });
          tokenStore.set(data.access_token);
          localStorage.setItem('vv_rt', data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          tokenStore.clear();
          localStorage.removeItem('vv_rt');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
