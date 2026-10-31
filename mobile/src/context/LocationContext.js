// mobile/src/context/LocationContext.js
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from './AuthContext';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  // 'undetermined' | 'granted' | 'denied' | 'services-off' | 'error'
  const [status, setStatus] = useState('undetermined');
  const [position, setPosition] = useState(null);
  const subRef = useRef(null);
  const runRef = useRef(0);

  const stop = useCallback(() => {
    runRef.current += 1; // invalidates any start() still in flight
    subRef.current?.remove();
    subRef.current = null;
  }, []);

  const start = useCallback(async () => {
    stop();
    const run = runRef.current;
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (run !== runRef.current) return;
      if (perm.status !== 'granted') {
        setStatus('denied');
        return;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        if (run !== runRef.current) return;
        setStatus('services-off');
        return;
      }
      setStatus('granted');

      const last = await Location.getLastKnownPositionAsync();
      if (run !== runRef.current) return;
      if (last) {
        setPosition({ latitude: last.coords.latitude, longitude: last.coords.longitude });
      }

      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 15, timeInterval: 8000 },
        (loc) => setPosition({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
      );
      if (run !== runRef.current) {
        sub.remove();
        return;
      }
      subRef.current = sub;
    } catch {
      if (run === runRef.current) setStatus('error');
    }
  }, [stop]);

  useEffect(() => {
    if (!userId) {
      stop();
      setPosition(null);
      setStatus('undetermined');
      return undefined;
    }
    start();
    return stop;
  }, [userId, start, stop]);

  // The student may switch location on in system settings and come back
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && userId && status !== 'granted') start();
    });
    return () => sub.remove();
  }, [status, userId, start]);

  return <LocationContext.Provider value={{ position, status, retry: start }}>{children}</LocationContext.Provider>;
}

export const useUserLocation = () => useContext(LocationContext);