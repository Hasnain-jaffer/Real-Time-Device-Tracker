// client/src/features/tracking/hooks/useTrackedDevices.js
import { useEffect, useState } from 'react';
import { useSocket } from '../../../app/SocketProvider';
import * as deviceApi from '../../devices/api/deviceApi';

export function useTrackedDevices() {
  const { socket } = useSocket();
  const [registeredDevices, setRegisteredDevices] = useState([]);
  const [liveData, setLiveData] = useState({}); // keyed by deviceId OR socket id fallback
  const [hiddenIds, setHiddenIds] = useState(new Set());

  useEffect(() => {
    deviceApi.listDevices().then(setRegisteredDevices).catch(() => {});
  }, []);

  useEffect(() => {
    function handleReceiveLocation(data) {
      const { id, deviceId, latitude, longitude } = data;
      const key = deviceId || id; // fall back to socket id for un-authenticated connections

      setLiveData((prev) => {
        const existing = prev[key];
        let speedKmh = null;
        if (existing) {
          const distanceM = haversineMeters(
            [existing.latitude, existing.longitude],
            [latitude, longitude]
          );
          const dtSeconds = (Date.now() - existing.updatedAt.getTime()) / 1000;
          if (dtSeconds > 0) speedKmh = (distanceM / dtSeconds) * 3.6;
        }
        return {
          ...prev,
          [key]: { socketId: id, deviceId: deviceId || null, latitude, longitude, updatedAt: new Date(), speedKmh },
        };
      });
    }

    function handleDisconnected(data) {
      const { id, deviceId } = data;
      const key = deviceId || id;
      setLiveData((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }

    socket.on('receive-location', handleReceiveLocation);
    socket.on('user-disconnected', handleDisconnected);
    return () => {
      socket.off('receive-location', handleReceiveLocation);
      socket.off('user-disconnected', handleDisconnected);
    };
  }, [socket]);

  // Merge: every live entry, enriched with registered device info if we have it
  const trackedDevices = Object.entries(liveData)
    .filter(([key]) => !hiddenIds.has(key))
    .map(([key, live]) => {
      const registered = registeredDevices.find((d) => d._id === live.deviceId);
      return {
        key,
        name: registered?.name || `Unknown device (${key.slice(0, 6)})`,
        identifier: registered?.identifier || '',
        isRegistered: !!registered,
        ...live,
      };
    });

  function toggleVisibility(key) {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return { trackedDevices, registeredDevices, toggleVisibility, hiddenIds };
}

function haversineMeters([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}