// mobile/src/context/LocationContext.js
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from './AuthContext';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [status, setStatus] = useState('undetermined');
  const [position, setPosition] = useState(null);
  const subRef = useRef(null);
  const runRef = useRef(0);
  const appStateRef = useRef(AppState.currentState);
  const hasRequestedRef = useRef(false);

  const stop = useCallback(() => {
    runRef.current += 1;
    if (subRef.current) {
      subRef.current.remove();
      subRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    stop();
    const run = runRef.current;
    
    try {
      // Check existing permission first (important for APK)
      let { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (run !== runRef.current) return;
      
      // If not determined, request it (this is the key fix for APK)
      if (existingStatus === 'undetermined') {
        // Only request once per app session to avoid spam
        if (hasRequestedRef.current) {
          setStatus('denied');
          return;
        }
        hasRequestedRef.current = true;
        
        const perm = await Location.requestForegroundPermissionsAsync();
        if (run !== runRef.current) return;
        existingStatus = perm.status;
      }
      
      if (existingStatus !== 'granted') {
        setStatus('denied');
        return;
      }
      
      // Check if location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (run !== runRef.current) return;
      
      if (!servicesEnabled) {
        setStatus('services-off');
        return;
      }
      
      setStatus('granted');

      // Get last known position first (fast)
      const last = await Location.getLastKnownPositionAsync();
      if (run !== runRef.current) return;
      if (last) {
        setPosition({ 
          latitude: last.coords.latitude, 
          longitude: last.coords.longitude 
        });
      }

      // Start watching position
      const sub = await Location.watchPositionAsync(
        { 
          accuracy: Location.Accuracy.Balanced, 
          distanceInterval: 15, 
          timeInterval: 8000 
        },
        (loc) => {
          if (run === runRef.current) {
            setPosition({ 
              latitude: loc.coords.latitude, 
              longitude: loc.coords.longitude 
            });
          }
        }
      );
      
      if (run !== runRef.current) {
        sub.remove();
        return;
      }
      
      subRef.current = sub;
    } catch (err) {
      console.error('[Location] Error:', err);
      if (run === runRef.current) setStatus('error');
    }
  }, [stop]);

  // Start/stop based on auth state
  useEffect(() => {
    if (!userId) {
      stop();
      setPosition(null);
      setStatus('undetermined');
      hasRequestedRef.current = false;
      return undefined;
    }
    start();
    return stop;
  }, [userId, start, stop]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (nextAppState === 'active' && userId) {
        // App came to foreground — restart if needed
        if (status !== 'granted') {
          start();
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background — stop to save battery
        stop();
      }
    });

    return () => subscription.remove();
  }, [status, userId, start, stop]);

  // Retry function for manual retry
  const retry = useCallback(() => {
    hasRequestedRef.current = false;
    start();
  }, [start]);

  return (
    <LocationContext.Provider value={{ position, status, retry }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useUserLocation = () => useContext(LocationContext);