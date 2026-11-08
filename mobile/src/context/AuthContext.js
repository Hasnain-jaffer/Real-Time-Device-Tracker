// mobile/src/context/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { refreshAccessToken, setAuthFailureHandler } from '../lib/apiClient';
import {
  setAccessToken,
  getRefreshToken,
  saveRefreshToken,
  clearTokens,
} from '../lib/tokenStore';

const AuthContext = createContext(null);

const USER_KEY = 'auth_user';

// Guests browse public data without an account
const GUEST_USER = {
  id: 'guest',
  role: 'student',
  name: 'Guest',
  email: '',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If a refresh fails inside apiClient, drop back to guest mode
    setAuthFailureHandler(() => {
      AsyncStorage.removeItem(USER_KEY).catch(() => {});
      setUser(GUEST_USER);
    });
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const refreshToken = await getRefreshToken();
      const cached = await AsyncStorage.getItem(USER_KEY);

      if (refreshToken && cached) {
        const cachedUser = JSON.parse(cached);
        try {
          // Get a fresh access token for this session
          await refreshAccessToken();
          setUser(cachedUser);
          setIsLoading(false);
          return;
        } catch (err) {
          if (!err.response) {
            // Network problem (e.g. server asleep): keep the user signed in.
            // apiClient will refresh the token on the first 401.
            setUser(cachedUser);
            setIsLoading(false);
            return;
          }
          // Refresh token rejected: session is over
          await clearTokens();
          await AsyncStorage.removeItem(USER_KEY);
        }
      }
    } catch (e) {
      console.log('Session restore error:', e);
    }

    setUser(GUEST_USER);
    setIsLoading(false);
  }

  async function login(email, password) {
    const { data } = await apiClient.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user: loggedInUser } = data;

    setAccessToken(accessToken);
    if (refreshToken) await saveRefreshToken(refreshToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));

    setUser(loggedInUser);
    return loggedInUser;
  }

  async function logout() {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Best effort: sign out locally even if the server call fails
    }
    await clearTokens();
    await AsyncStorage.removeItem(USER_KEY);
    setUser(GUEST_USER);
  }

  function updateUser(updates) {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      if (next.id !== 'guest') {
        AsyncStorage.setItem(USER_KEY, JSON.stringify(next)).catch(() => {});
      }
      return next;
    });
  }

  const isGuest = user?.id === 'guest';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, updateUser, isGuest, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);