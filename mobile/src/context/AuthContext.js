// mobile/src/context/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import apiClient, { refreshAccessToken, setAuthFailureHandler } from '../lib/apiClient';
import { setAccessToken, getRefreshToken, saveRefreshToken, clearTokens } from '../lib/tokenStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session on launch from the stored refresh token
  useEffect(() => {
    setAuthFailureHandler(() => setUser(null));

    (async () => {
      try {
        const stored = await getRefreshToken();
        if (!stored) return;
        await refreshAccessToken();
        const { data } = await apiClient.get('/auth/me');
        setUser(data.user);
      } catch (err) {
        // Only forget the session if the server rejected it. A network error
        // (offline, server waking) must not log the student out.
        if (err.response && [401, 403].includes(err.response.status)) await clearTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function login(email, password) {
    const { data } = await apiClient.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    if (data.refreshToken) await saveRefreshToken(data.refreshToken);
    setUser(data.user);
  }

  async function logout() {
    try {
      const refreshToken = await getRefreshToken();
      await apiClient.post('/auth/logout', { refreshToken });
    } catch {
      // Logging out locally matters more than telling the server
    }
    await clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);