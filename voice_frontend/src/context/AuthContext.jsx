import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { tokenStore } from '../api/tokenStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);   // user profile object
  const [loading, setLoading] = useState(true);   // true while restoring session

  // ── Restore session from localStorage refresh token ──────────────
  useEffect(() => {
    const rt = localStorage.getItem('vv_rt');
    if (!rt) { setLoading(false); return; }

    api.post('/auth/refresh', { refresh_token: rt })
      .then(({ data }) => {
        tokenStore.set(data.access_token);
        localStorage.setItem('vv_rt', data.refresh_token);
        return api.get('/auth/me');
      })
      .then(({ data }) => setUser(data))
      .catch(() => {
        tokenStore.clear();
        localStorage.removeItem('vv_rt');
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Login ─────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    tokenStore.set(data.access_token);
    localStorage.setItem('vv_rt', data.refresh_token);
    const { data: me } = await api.get('/auth/me');
    setUser(me);
    return me;
  };

  // ── Register ──────────────────────────────────────────────────────
  const register = async (username, email, password, avatar_color = '#5B21B6') => {
    const { data } = await api.post('/auth/register', {
      username, email, password, avatar_color,
    });
    tokenStore.set(data.access_token);
    localStorage.setItem('vv_rt', data.refresh_token);
    const { data: me } = await api.get('/auth/me');
    setUser(me);
    return me;
  };

  // ── Logout ────────────────────────────────────────────────────────
  const logout = async () => {
    const rt = localStorage.getItem('vv_rt');
    try {
      if (rt) await api.post('/auth/logout', { refresh_token: rt });
    } catch { /* ignore network errors on logout */ }
    tokenStore.clear();
    localStorage.removeItem('vv_rt');
    setUser(null);
  };

  // ── Update profile ────────────────────────────────────────────────
  const updateProfile = async (updates) => {
    const { data } = await api.patch('/auth/me', updates);
    setUser(data);
    return data;
  };

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, register, logout, updateProfile,
      getToken: tokenStore.get,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
