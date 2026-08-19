// client/src/features/devices/hooks/useDeviceSchedule.js
import { useEffect, useState } from 'react';
import apiClient from '../../../lib/apiClient';

export function useDeviceSchedule(deviceId) {
  const [stops, setStops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) return;
    setIsLoading(true);
    apiClient
      .get(`/schedule/device/${deviceId}/delay`)
      .then(({ data }) => setStops(data.stops))
      .catch(() => setStops([]))
      .finally(() => setIsLoading(false));
  }, [deviceId]);

  return { stops, isLoading };
}