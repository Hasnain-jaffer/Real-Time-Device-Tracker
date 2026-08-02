// client/src/lib/socketClient.js
import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem('accessToken');
    socket = io(import.meta.env.VITE_SOCKET_URL, {
      autoConnect: false,
      auth: { token },
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  // refresh token in case it changed since socket was created
  s.auth = { token: localStorage.getItem('accessToken') };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket && socket.connected) socket.disconnect();
}