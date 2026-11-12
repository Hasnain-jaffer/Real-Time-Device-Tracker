// client/src/features/tracking/components/TrackerControl.jsx
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { useSocket } from '../../../app/SocketProvider';
import * as deviceApi from '../../devices/api/deviceApi';

function AdminTracker() {
  const { socket, isConnected } = useSocket();
  const [buses, setBuses] = useState([]);
  const [target, setTarget] = useState(''); // '' = just show me on the map
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');

  const watchId = useRef(null);
  const wakeLock = useRef(null);
  const targetRef = useRef('');
  targetRef.current = target;

  useEffect(() => {
    deviceApi.listDevices().then(setBuses).catch(() => {});
  }, []);

  async function holdScreenAwake() {
    try {
      if ('wakeLock' in navigator && !wakeLock.current) {
        wakeLock.current = await navigator.wakeLock.request('screen');
        wakeLock.current.addEventListener('release', () => { wakeLock.current = null; });
      }
    } catch {
      // optional feature: sharing works without it
    }
  }

  function stop() {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      socket.emit('stop-location');
    }
    wakeLock.current?.release().catch(() => {});
    wakeLock.current = null;
    setSharing(false);
  }
  const stopRef = useRef(stop);
  stopRef.current = stop;

  function start() {
    if (!navigator.geolocation) {
      setError('This browser cannot share its location.');
      return;
    }
    setError('');
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        if (!socket.connected) return;
        socket.emit('send-location', {
          latitude: coords.latitude,
          longitude: coords.longitude,
          deviceId: targetRef.current || undefined,
        });
        setError((prev) => (prev ? '' : prev));
      },
      (err) => {
        if (err.code === 1) {
          setError('Location permission was denied.');
          stopRef.current();
        } else {
          setError('Waiting for a GPS signal…');
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    setSharing(true);
    holdScreenAwake();
  }

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible' && watchId.current != null) holdScreenAwake();
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      stopRef.current();
    };
  }, []);

  return (
    <div
      className="rounded-xl p-3 mb-3"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
        Share this device's location
      </p>
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        disabled={sharing}
        className="w-full rounded-lg px-3 py-2 text-xs mb-2 focus:outline-none disabled:opacity-60"
        style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      >
        <option value="">Just show me on the map</option>
        {buses.map((b) => (
          <option key={b._id} value={b._id}>As bus: {b.name}</option>
        ))}
      </select>
      <button
        onClick={sharing ? stop : start}
        disabled={!sharing && !isConnected}
        className="w-full rounded-lg py-2 text-xs font-bold text-white disabled:opacity-50"
        style={{ backgroundColor: sharing ? 'var(--accent-critical, #B94A3A)' : 'var(--accent-primary)' }}
      >
        {sharing ? 'Stop sharing' : 'Start sharing'}
      </button>
      <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
        Keep this screen open while sharing. Choosing a bus makes your position count as that bus, including stop
        arrivals, delays and alerts.
      </p>
      {error && (
        <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--accent-critical, #B94A3A)' }}>{error}</p>
      )}
    </div>
  );
}

export default function TrackerControl() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminTracker /> : null;
}