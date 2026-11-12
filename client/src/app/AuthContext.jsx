// client/src/app/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import apiClient, { setAuthFailureHandler } from '../lib/apiClient';
import { setAccessToken, clearAccessToken } from '../lib/tokenStore';
import { connectSocket, disconnectSocket } from '../lib/socketClient';

const AuthContext = createContext(null);

// Guests browse public data without an account
const GUEST_USER = { id: 'guest', role: 'student', name: 'Guest', email: '' };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If a token refresh fails anywhere in the app, fall back to guest mode
    setAuthFailureHandler(() => setUser(GUEST_USER));

    // On first load (or full page refresh) there is no access token in memory yet,
    // so silently try to get one using the httpOnly refresh cookie.
    // No cookie or an invalid one simply means the visitor is a guest.
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
        clearAccessToken();
        setUser(GUEST_USER);
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
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Sign out locally even if the server call fails
    }
    clearAccessToken();
    setUser(GUEST_USER);
    // Reconnect the socket so it stops receiving the previous user's private alerts
    disconnectSocket();
    connectSocket();
  }

  const isGuest = !user || user.id === 'guest';
  const isAdmin = !isGuest && user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, setUser, isGuest, isAdmin, isAuthenticated: !isGuest }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}