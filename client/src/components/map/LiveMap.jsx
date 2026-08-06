// client/src/components/map/LiveMap.jsx
import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSocket } from '../../app/SocketProvider';
import { TILE_LAYERS, getStoredMapStyle } from './tileLayers';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STALE_MS = 15000; // no ping in 15s = considered "reconnecting/offline"

function haversineMeters([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function AutoFollow({ devices, autoFollow }) {
  const map = useMap();
  useEffect(() => {
    if (!autoFollow) return;
    const ids = Object.keys(devices);
    if (ids.length === 0) return;
    const last = devices[ids[ids.length - 1]];
    if (last) map.setView([last.latitude, last.longitude], map.getZoom());
  }, [devices, autoFollow, map]);
  return null;
}

export default function LiveMap() {
  const { socket } = useSocket();
  const [devices, setDevices] = useState({});
  // { [id]: { latitude, longitude, updatedAt, accuracy, speedKmh, prev: {lat,lng,time} } }
  const [autoFollow, setAutoFollow] = useState(true);
  const [mapStyle, setMapStyle] = useState(getStoredMapStyle());
  const [ownAccuracy, setOwnAccuracy] = useState(null);
  const [ownPosition, setOwnPosition] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Tick every few seconds so "connection status" (stale/online) updates live
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleReceiveLocation(data) {
      const { id, latitude, longitude } = data;
      setDevices((prev) => {
        const existing = prev[id];
        let speedKmh = null;

        if (existing) {
          const distanceM = haversineMeters(
            [existing.latitude, existing.longitude],
            [latitude, longitude]
          );
          const dtSeconds = (Date.now() - existing.updatedAt.getTime()) / 1000;
          if (dtSeconds > 0) {
            speedKmh = (distanceM / dtSeconds) * 3.6;
          }
        }

        return {
          ...prev,
          [id]: {
            latitude,
            longitude,
            updatedAt: new Date(),
            speedKmh,
          },
        };
      });
    }

    function handleUserDisconnected(data) {
      const { id } = data;
      setDevices((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }

    socket.on('receive-location', handleReceiveLocation);
    socket.on('user-disconnected', handleUserDisconnected);

    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setOwnAccuracy(accuracy);
          setOwnPosition([latitude, longitude]);
          socket.emit('send-location', { latitude, longitude });
        },
        (error) => console.error('[geolocation]', error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }

    return () => {
      socket.off('receive-location', handleReceiveLocation);
      socket.off('user-disconnected', handleUserDisconnected);
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [socket]);

  const deviceIds = Object.keys(devices);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-soft">
      <MapContainer
        center={[0, 0]}
        zoom={16}
        scrollWheelZoom
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          key={mapStyle}
          url={TILE_LAYERS[mapStyle].url}
          attribution={TILE_LAYERS[mapStyle].attribution}
        />
        <AutoFollow devices={devices} autoFollow={autoFollow} />

        {ownPosition && ownAccuracy && (
          <Circle
            center={ownPosition}
            radius={ownAccuracy}
            pathOptions={{
              color: '#2563EB',
              fillColor: '#2563EB',
              fillOpacity: 0.1,
              weight: 1,
            }}
          />
        )}

        <MarkerClusterGroup chunkedLoading>
          {deviceIds.map((id) => {
            const device = devices[id];
            const msSinceUpdate = now - device.updatedAt.getTime();
            const isStale = msSinceUpdate > STALE_MS;

            return (
              <Marker key={id} position={[device.latitude, device.longitude]}>
                <Popup>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">Device {id.slice(0, 6)}</p>
                    <p>Lat: {device.latitude.toFixed(5)}</p>
                    <p>Lng: {device.longitude.toFixed(5)}</p>
                    <p>
                      Speed:{' '}
                      {device.speedKmh != null
                        ? `${device.speedKmh.toFixed(1)} km/h`
                        : '—'}
                    </p>
                    <p className="flex items-center gap-1.5">
                      Status:{' '}
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          isStale ? 'bg-warning' : 'bg-success'
                        }`}
                      />
                      {isStale ? 'Reconnecting…' : 'Online'}
                    </p>
                    <p className="text-gray-500">
                      Updated: {device.updatedAt.toLocaleTimeString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      <div className="absolute top-3 left-3 z-[1000] glass rounded-xl shadow-soft p-1 flex gap-1">
        {Object.keys(TILE_LAYERS).map((style) => (
          <button
            key={style}
            onClick={() => {
              setMapStyle(style);
              localStorage.setItem('mapStyle', style);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
              mapStyle === style
                ? 'bg-primary text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {style}
          </button>
        ))}
      </div>

      <div className="absolute top-3 right-3 z-[1000] glass rounded-xl shadow-soft px-3 py-2 flex items-center gap-2">
        <label className="text-xs font-medium flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoFollow}
            onChange={(e) => setAutoFollow(e.target.checked)}
          />
          Auto-follow
        </label>
      </div>

      <div className="absolute bottom-3 left-3 z-[1000] glass rounded-xl shadow-soft px-3 py-1.5 text-xs">
        {deviceIds.length} device{deviceIds.length !== 1 ? 's' : ''} online
        {ownAccuracy && (
          <span className="ml-2 text-gray-500">
            · Accuracy: ±{Math.round(ownAccuracy)}m
          </span>
        )}
      </div>
    </div>
  );
}