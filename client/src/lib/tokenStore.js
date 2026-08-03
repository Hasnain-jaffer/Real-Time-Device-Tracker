// client/src/lib/tokenStore.js
// In-memory only. Never persisted to localStorage/sessionStorage.
// Cleared automatically on tab close or full page reload.

let accessToken = null;
const listeners = new Set();

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
  listeners.forEach((listener) => listener(token));
}

export function clearAccessToken() {
  setAccessToken(null);
}

// Lets React components (e.g. AuthContext) react to token changes if needed
export function onAccessTokenChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}