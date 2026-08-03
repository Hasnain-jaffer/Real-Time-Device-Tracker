// client/src/components/map/LiveMap.jsx
import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSocket } from '../../app/SocketProvider';
import { TILE_LAYERS, getStoredMapStyle } from './tileLayers';
import MarkerClusterGroup from 'react-leaflet-cluster';

// Default Leaflet marker icons don't load correctly with bundlers unless fixed like this
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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
  const [devices, setDevices] = useState({}); // { [socketId]: { latitude, longitude, updatedAt } }
  const [autoFollow, setAutoFollow] = useState(true);
  const [mapStyle, setMapStyle] = useState(getStoredMapStyle());
  const devicesRef = useRef(devices);
  devicesRef.current = devices;

  useEffect(() => {
    // Same event names/payload as V1 — receive-location / user-disconnected
    function handleReceiveLocation(data) {
      const { id, latitude, longitude } = data;
      setDevices((prev) => ({
        ...prev,
        [id]: { latitude, longitude, updatedAt: new Date() },
      }));
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

    // Start broadcasting this browser's own location, same as V1 script.js
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
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

        <MarkerClusterGroup chunkedLoading>
          {deviceIds.map((id) => {
            const device = devices[id];
            return (
              <Marker key={id} position={[device.latitude, device.longitude]}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-medium">Device {id.slice(0, 6)}</p>
                    <p>Lat: {device.latitude.toFixed(5)}</p>
                    <p>Lng: {device.longitude.toFixed(5)}</p>
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

      <div className="absolute bottom-3 left-3 z-[1000] glass rounded-xl shadow-soft px-3 py-1.5 text-xs">
        {deviceIds.length} device{deviceIds.length !== 1 ? 's' : ''} online
      </div>
    </div>
  );
}