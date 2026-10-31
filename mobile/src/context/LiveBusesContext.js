// mobile/src/context/LiveBusesContext.js
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import apiClient from '../lib/apiClient';
import { haversineMeters } from '../utils/geo';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const LiveBusesContext = createContext(null);

export function LiveBusesProvider({ children }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const userId = user?.id;

  const [devices, setDevices] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [live, setLive] = useState({}); // deviceId -> { latitude, longitude, updatedAt, speedKmh }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadingRef = useRef(false);
  const knownIds = useRef(new Set());
  const lastUnknownLoad = useRef(0);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const [d, r] = await Promise.all([apiClient.get('/devices'), apiClient.get('/routes')]);
      const list = d.data.devices;
      knownIds.current = new Set(list.map((x) => x._id));
      setDevices(list);
      setRoutes(r.data.routes);
      // Keep fresh positions we already have, seed the rest from the server's
      // last known location, and drop anything the server says is offline.
      setLive((prev) => {
        const next = {};
        for (const dev of list) {
          if (dev.status !== 'online') continue;
          if (prev[dev._id]) next[dev._id] = prev[dev._id];
          else if (dev.lastLocation?.latitude != null) {
            next[dev._id] = {
              latitude: dev.lastLocation.latitude,
              longitude: dev.lastLocation.longitude,
              updatedAt: new Date(dev.lastSeenAt || Date.now()).getTime(),
              speedKmh: null,
            };
          }
        }
        return next;
      });
      setError('');
    } catch {
      setError('Could not load buses. Pull down to retry.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setDevices([]);
      setRoutes([]);
      setLive({});
      setLoading(true);
      knownIds.current = new Set();
      return;
    }
    load();
  }, [userId, load]);

  useEffect(() => {
    if (!userId || !socket) return undefined;

    const onLocation = (data) => {
      const { deviceId, latitude, longitude } = data;
      // Anonymous broadcasts (e.g. a web tab sharing its own GPS) are not buses
      if (!deviceId || latitude == null || longitude == null) return;

      if (!knownIds.current.has(deviceId) && Date.now() - lastUnknownLoad.current > 30000) {
        lastUnknownLoad.current = Date.now(); // a bus registered after we loaded
        load();
      }

      const now = Date.now();
      setLive((prev) => {
        const existing = prev[deviceId];
        let speedKmh = existing?.speedKmh ?? null;
        if (existing) {
          const dt = (now - existing.updatedAt) / 1000;
          if (dt > 0.5) {
            const v = (haversineMeters(existing.latitude, existing.longitude, latitude, longitude) / dt) * 3.6;
            if (v < 150) speedKmh = v; // ignore GPS jumps
          }
        }
        return { ...prev, [deviceId]: { latitude, longitude, updatedAt: now, speedKmh } };
      });

      setDevices((prev) =>
        prev.some((d) => d._id === deviceId && d.status !== 'online')
          ? prev.map((d) => (d._id === deviceId ? { ...d, status: 'online' } : d))
          : prev
      );
    };

    const onGone = ({ deviceId }) => {
      if (!deviceId) return;
      setLive((prev) => {
        if (!prev[deviceId]) return prev;
        const next = { ...prev };
        delete next[deviceId];
        return next;
      });
      setDevices((prev) => prev.map((d) => (d._id === deviceId ? { ...d, status: 'offline' } : d)));
    };

    socket.on('receive-location', onLocation);
    socket.on('user-disconnected', onGone);
    socket.on('connect', load); // catch up on anything missed while disconnected
    const appState = AppState.addEventListener('change', (s) => s === 'active' && load());

    return () => {
      socket.off('receive-location', onLocation);
      socket.off('user-disconnected', onGone);
      socket.off('connect', load);
      appState.remove();
    };
  }, [userId, socket, load]);

  const routeNameById = useMemo(() => new Map(routes.map((r) => [r._id, r.name])), [routes]);

  const buses = useMemo(
    () =>
      devices.map((d) => {
        const l = live[d._id];
        return {
          id: d._id,
          name: d.name,
          identifier: d.identifier,
          routeId: d.routeId || null,
          routeName: d.routeId ? routeNameById.get(d.routeId) || '' : '',
          isLive: !!l || d.status === 'online',
          latitude: l?.latitude ?? null,
          longitude: l?.longitude ?? null,
          speedKmh: l?.speedKmh ?? null,
          updatedAt: l?.updatedAt ?? (d.lastSeenAt ? new Date(d.lastSeenAt).getTime() : null),
        };
      }),
    [devices, live, routeNameById]
  );

  const liveBuses = useMemo(() => buses.filter((b) => b.isLive && b.latitude != null), [buses]);

  return (
    <LiveBusesContext.Provider value={{ buses, liveBuses, routes, loading, error, refresh: load }}>
      {children}
    </LiveBusesContext.Provider>
  );
}

export const useLiveBuses = () => useContext(LiveBusesContext);