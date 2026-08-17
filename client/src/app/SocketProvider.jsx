// client/src/app/SocketProvider.jsx
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socketClient';
import { onAccessTokenChange, getAccessToken } from '../lib/tokenStore';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    function handleConnect() {
      setIsConnected(true);
      // Every fresh connection (including auto-reconnects) needs to re-identify,
      // since a reconnect doesn't automatically carry the latest token otherwise.
      const token = getAccessToken();
      if (token) socket.emit('identify', { token });
    }
    function handleDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Whenever the access token changes for any reason (login, silent refresh
    // on load, refresh-after-401), immediately tell the already-open socket
    // about it so the private notification room stays valid without needing
    // a full reconnect.
    const unsubscribe = onAccessTokenChange((token) => {
      if (token && socket.connected) {
        socket.emit('identify', { token });
      }
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      unsubscribe();
      disconnectSocket();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: getSocket(), isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}