// mobile/src/context/NotificationsContext.js
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import apiClient from '../lib/apiClient';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const userId = user?.id;

  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [latest, setLatest] = useState(null); // drives the in-app banner

  const itemsRef = useRef([]);
  itemsRef.current = items;
  const knownIds = useRef(new Set());
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const { data } = await apiClient.get('/notifications');
      knownIds.current = new Set(data.notifications.map((n) => n._id));
      setItems(data.notifications);
      setUnreadCount(data.unreadCount);
      setError('');
    } catch {
      setError('Could not load alerts. Pull down to retry.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setUnreadCount(0);
      setLatest(null);
      setLoading(true);
      knownIds.current = new Set();
      return;
    }
    load();
  }, [userId, load]);

  useEffect(() => {
    if (!userId || !socket) return undefined;

    const onNew = (n) => {
      if (!n?._id || knownIds.current.has(n._id)) return; // already loaded: don't double count
      knownIds.current.add(n._id);
      setItems((prev) => [n, ...prev]);
      setUnreadCount((c) => c + 1);
      setLatest(n);
    };

    socket.on('notification', onNew);
    socket.on('connect', load); // catch up on anything missed while offline
    const appState = AppState.addEventListener('change', (s) => s === 'active' && load());

    return () => {
      socket.off('notification', onNew);
      socket.off('connect', load);
      appState.remove();
    };
  }, [userId, socket, load]);

  const markRead = useCallback(
    async (id) => {
      const target = itemsRef.current.find((n) => n._id === id);
      if (!target || target.isRead) return;
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await apiClient.patch(`/notifications/${id}/read`);
      } catch {
        load(); // put the server's truth back
      }
    },
    [load]
  );

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await apiClient.patch('/notifications/read-all');
    } catch {
      load();
    }
  }, [load]);

  return (
    <NotificationsContext.Provider value={{ items, unreadCount, loading, error, latest, refresh: load, markRead, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);