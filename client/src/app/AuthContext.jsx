// client/src/app/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import apiClient from '../lib/apiClient';
import { getAccessToken, setAccessToken, clearAccessToken } from '../lib/tokenStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load (or full page refresh), there's no access token in memory yet —
  // silently try to get a new one using the httpOnly refresh cookie.
  useEffect(() => {
    async function restoreSession() {
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        setAccessToken(data.accessToken);

        const meRes = await apiClient.get('/auth/me');
        setUser(meRes.data.user);
      } catch {
        // No valid refresh cookie — user is simply logged out, not an error.
        clearAccessToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  async function login(email, password) {
    const { data } = await apiClient.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    await apiClient.post('/auth/logout');
    clearAccessToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setUser, isAuthenticated: !!getAccessToken() || !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}