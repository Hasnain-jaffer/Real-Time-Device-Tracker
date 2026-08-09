// client/src/features/devices/hooks/useDeviceDetails.js
import { useEffect, useState, useCallback } from 'react';
import apiClient from '../../../lib/apiClient';
import * as deviceApi from '../api/deviceApi';

export function useDeviceDetails(deviceId) {
  const [device, setDevice] = useState(null);
  const [recentPings, setRecentPings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!deviceId) return;
    setIsLoading(true);
    setError('');
    try {
      const devices = await deviceApi.listDevices();
      const found = devices.find((d) => d._id === deviceId);
      if (!found) throw new Error('Device not found');
      setDevice(found);

      // Reuses the existing history endpoint, keyed by device's own _id
      // (works because location.socket.js now persists deviceId on pings)
const historyRes = await apiClient.get(`/history/device/${deviceId}?limit=20`);      setRecentPings(historyRes.data.pings || []);

      const notifRes = await apiClient.get('/notifications');
      setNotifications(notifRes.data.notifications || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load device');
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { device, recentPings, notifications, isLoading, error, refresh };
}