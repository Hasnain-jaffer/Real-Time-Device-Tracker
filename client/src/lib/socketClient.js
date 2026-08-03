// client/src/lib/socketClient.js
import { io } from 'socket.io-client';
import { getAccessToken } from './tokenStore';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL, {
      autoConnect: false,
      auth: { token: getAccessToken() },
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  s.auth = { token: getAccessToken() };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket && socket.connected) socket.disconnect();
}