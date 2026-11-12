// client/src/features/devices/hooks/useDeviceDetails.js
import { useEffect, useState, useCallback } from 'react';
import apiClient from '../../../lib/apiClient';
import * as deviceApi from '../api/deviceApi';
import { useAuth } from '../../../app/AuthContext';

export function useDeviceDetails(deviceId) {
  const { isGuest } = useAuth();
  const [device, setDevice] = useState(null);
  const [recentPings, setRecentPings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!deviceId) return;
    setIsLoading(true);
    setError('');

    // The bus itself is required: if this fails the page shows an error
    try {
      const devices = await deviceApi.listDevices();
      const found = devices.find((d) => d._id === deviceId);
      if (!found) throw new Error('Device not found');
      setDevice(found);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load device');
      setIsLoading(false);
      return;
    }

    // Recent pings and notifications are extras: if either fails, the page still loads
    try {
      const historyRes = await apiClient.get(`/history/device/${deviceId}?limit=20`);
      setRecentPings(historyRes.data.pings || []);
    } catch {
      setRecentPings([]);
    }

    if (isGuest) {
      setNotifications([]); // personal data: guests have none
    } else {
      try {
        const notifRes = await apiClient.get('/notifications');
        setNotifications(notifRes.data.notifications || []);
      } catch {
        setNotifications([]);
      }
    }

    setIsLoading(false);
  }, [deviceId, isGuest]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { device, recentPings, notifications, isLoading, error, refresh };
}