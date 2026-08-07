// client/src/components/map/LiveMap.jsx
import { useEffect, useState } from 'react';
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

function AutoFollow({ devices, autoFollow, selectedKey }) {
  const map = useMap();
  useEffect(() => {
    if (!autoFollow) return;
    const target = selectedKey
      ? devices.find((d) => d.key === selectedKey)
      : devices[devices.length - 1];
    if (target) map.setView([target.latitude, target.longitude], map.getZoom());
  }, [devices, autoFollow, selectedKey, map]);
  return null;
}

export default function LiveMap({ devices, selectedKey, onSelectDevice }) {
  const { socket } = useSocket();
  const [autoFollow, setAutoFollow] = useState(true);
  const [mapStyle, setMapStyle] = useState(getStoredMapStyle());
  const [ownAccuracy, setOwnAccuracy] = useState(null);
  const [ownPosition, setOwnPosition] = useState(null);

  // Own browser still streams its position (unchanged V1 behavior) —
  // separate from `devices`, which is now driven by the parent (useTrackedDevices).
  useEffect(() => {
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
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [socket]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-soft">
      <MapContainer center={[0, 0]} zoom={16} scrollWheelZoom style={{ width: '100%', height: '100%' }}>
        <TileLayer
          key={mapStyle}
          url={TILE_LAYERS[mapStyle].url}
          attribution={TILE_LAYERS[mapStyle].attribution}
        />
        <AutoFollow devices={devices} autoFollow={autoFollow} selectedKey={selectedKey} />

        {ownPosition && ownAccuracy && (
          <Circle
            center={ownPosition}
            radius={ownAccuracy}
            pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.1, weight: 1 }}
          />
        )}

        <MarkerClusterGroup chunkedLoading>
          {devices.map((device) => (
            <Marker
              key={device.key}
              position={[device.latitude, device.longitude]}
              eventHandlers={{ click: () => onSelectDevice(device.key) }}
            >
              <Popup>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{device.name}</p>
                  {device.identifier && <p className="text-gray-500">{device.identifier}</p>}
                  <p>Lat: {device.latitude.toFixed(5)}</p>
                  <p>Lng: {device.longitude.toFixed(5)}</p>
                  <p>Speed: {device.speedKmh != null ? `${device.speedKmh.toFixed(1)} km/h` : '—'}</p>
                  <p className="text-gray-500">Updated: {device.updatedAt.toLocaleTimeString()}</p>
                </div>
              </Popup>
            </Marker>
          ))}
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
              mapStyle === style ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {style}
          </button>
        ))}
      </div>

      <div className="absolute top-3 right-3 z-[1000] glass rounded-xl shadow-soft px-3 py-2 flex items-center gap-2">
        <label className="text-xs font-medium flex items-center gap-1.5 cursor-pointer select-none">
          <input type="checkbox" checked={autoFollow} onChange={(e) => setAutoFollow(e.target.checked)} />
          Auto-follow
        </label>
      </div>

      <div className="absolute bottom-3 left-3 z-[1000] glass rounded-xl shadow-soft px-3 py-1.5 text-xs">
        {devices.length} bus{devices.length !== 1 ? 'es' : ''} tracked
        {ownAccuracy && <span className="ml-2 text-gray-500">· Accuracy: ±{Math.round(ownAccuracy)}m</span>}
      </div>
    </div>
  );
}