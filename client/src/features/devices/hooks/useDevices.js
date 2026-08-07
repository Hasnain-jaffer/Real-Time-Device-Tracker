// client/src/features/devices/hooks/useDevices.js
import { useCallback, useEffect, useState } from 'react';
import * as deviceApi from '../api/deviceApi';

export function useDevices() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await deviceApi.listDevices();
      setDevices(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addDevice(payload) {
    const device = await deviceApi.createDevice(payload);
    setDevices((prev) => [device, ...prev]);
    return device;
  }

  async function editDevice(id, updates) {
    const updated = await deviceApi.updateDevice(id, updates);
    setDevices((prev) => prev.map((d) => (d._id === id ? updated : d)));
    return updated;
  }

  async function removeDevice(id) {
    await deviceApi.deleteDevice(id);
    setDevices((prev) => prev.filter((d) => d._id !== id));
  }

  async function regenerateKey(id) {
    const updated = await deviceApi.regenerateDeviceKey(id);
    setDevices((prev) => prev.map((d) => (d._id === id ? updated : d)));
    return updated;
  }

  return { devices, isLoading, error, refresh, addDevice, editDevice, removeDevice, regenerateKey };
}