// mobile/src/lib/tokenStore.js
// Access token lives in memory only. Refresh token lives in the OS secure store
// (Keychain / Android Keystore), the mobile equivalent of the web's httpOnly cookie.
import * as SecureStore from 'expo-secure-store';

const REFRESH_KEY = 'routepulse_refresh_token';
let accessToken = null;
const listeners = new Set();

export const getAccessToken = () => accessToken;

export function setAccessToken(token) {
  accessToken = token;
  listeners.forEach((fn) => fn(token));
}

export function onAccessTokenChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH_KEY);
export const saveRefreshToken = (token) => SecureStore.setItemAsync(REFRESH_KEY, token);

export async function clearTokens() {
  setAccessToken(null);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}