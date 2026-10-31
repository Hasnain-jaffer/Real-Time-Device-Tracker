// mobile/src/context/SocketContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../lib/socketClient';
import { getAccessToken, onAccessTokenChange } from '../lib/tokenStore';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return undefined;
    const socket = getSocket();

    const onConnect = () => {
      setIsConnected(true);
      const token = getAccessToken();
      if (token) socket.emit('identify', { token });
    };
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    // Re-identify when the access token is refreshed, same as the web app
    const unsubscribe = onAccessTokenChange((token) => {
      if (token && socket.connected) socket.emit('identify', { token });
    });

    socket.connect();

    return () => {
      unsubscribe();
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.disconnect();
      setIsConnected(false);
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket: getSocket(), isConnected }}>{children}</SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);