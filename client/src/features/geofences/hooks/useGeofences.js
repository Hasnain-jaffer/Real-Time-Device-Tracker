// client/src/features/geofences/hooks/useGeofences.js
import { useCallback, useEffect, useState } from 'react';
import * as geofenceApi from '../api/geofenceApi';

export function useGeofences(deviceId) {
  const [geofences, setGeofences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      setGeofences(await geofenceApi.listGeofences(deviceId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load stops');
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addGeofence(payload) {
    const fence = await geofenceApi.createGeofence({ ...payload, deviceIds: deviceId ? [deviceId] : payload.deviceIds });
    setGeofences((prev) => [fence, ...prev]);
    return fence;
  }

  async function editGeofence(id, updates) {
    const updated = await geofenceApi.updateGeofence(id, updates);
    setGeofences((prev) => prev.map((f) => (f._id === id ? updated : f)));
    return updated;
  }

  async function removeGeofence(id) {
    await geofenceApi.deleteGeofence(id);
    setGeofences((prev) => prev.filter((f) => f._id !== id));
  }

  return { geofences, isLoading, error, refresh, addGeofence, editGeofence, removeGeofence };
}