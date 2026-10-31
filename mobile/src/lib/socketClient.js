// mobile/src/lib/socketClient.js
import { io } from 'socket.io-client';
import { API_ORIGIN } from '../config';
import { getAccessToken } from './tokenStore';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(API_ORIGIN, {
      autoConnect: false,
      transports: ['websocket'],
      // A function, so every (re)connect attempt sends the latest token
      auth: (cb) => cb({ token: getAccessToken() }),
      reconnection: true,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}