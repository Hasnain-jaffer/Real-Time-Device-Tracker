// mobile/src/context/SocketContext.js
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { io } from 'socket.io-client';
import { getAccessToken, onAccessTokenChange } from '../lib/tokenStore';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const connect = useCallback(() => {
    if (!userId) return;
    
    // Don't reconnect if already connected
    if (socketRef.current?.connected) return;

    disconnect(); // Clean any existing socket

    const API_URL = process.env.EXPO_PUBLIC_API_URL;
    if (!API_URL) {
      console.error('[Socket] EXPO_PUBLIC_API_URL is not defined');
      return;
    }

    const token = getAccessToken();
    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected');
      setIsConnected(true);
      const currentToken = getAccessToken();
      if (currentToken) socket.emit('identify', { token: currentToken });
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.log('[Socket] Connection error:', error.message);
      setIsConnected(false);
    });

    socketRef.current = socket;
  }, [userId, disconnect]);

  // Connect when user logs in, disconnect on logout
  useEffect(() => {
    if (userId) {
      connect();
    } else {
      disconnect();
    }
    return disconnect; // Cleanup on unmount
  }, [userId, connect, disconnect]);

  // CRITICAL FIX: Handle app going to background/foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App going to background — disconnect socket to allow clean exit
        console.log('[Socket] App backgrounded, disconnecting');
        disconnect();
      } else if (nextAppState === 'active' && userId) {
        // App coming to foreground — reconnect
        console.log('[Socket] App active, reconnecting');
        connect();
      }
    });

    return () => subscription.remove();
  }, [userId, connect, disconnect]);

  // Re-identify when token refreshes
  useEffect(() => {
    const unsubscribe = onAccessTokenChange((token) => {
      if (token && socketRef.current?.connected) {
        socketRef.current.emit('identify', { token });
      }
    });
    return unsubscribe;
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, reconnect: connect }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};