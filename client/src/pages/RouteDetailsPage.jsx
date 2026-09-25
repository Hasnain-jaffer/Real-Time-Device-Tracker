// client/src/pages/RouteDetailsPage.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Circle, Tooltip } from 'react-leaflet';
import * as geofenceApi from '../features/geofences/api/geofenceApi';
import GeofenceFormModal from '../features/geofences/components/GeofenceFormModal';
import MapSizeFix from '../components/map/MapSizeFix';
import { useTheme } from '../app/ThemeContext';
import { useAuth } from '../app/AuthContext';
import { useToast } from '../app/ToastContext';

const lightTokens = {
  '--bg-page': '#F4EFE6', '--bg-surface': '#FFFFFF', '--border': '#E1D9C8',
  '--text-primary': '#173B32', '--text-secondary': '#5B6B5F', '--text-muted': '#9C8F73',
  '--accent-primary': '#5E8C61', '--accent-eta': '#D59A3A', '--accent-critical': '#B94A3A',
};
const darkTokens = {
  '--bg-page': '#12181A', '--bg-surface': '#182220', '--border': '#263531',
  '--text-primary': '#F1EEE4', '--text-secondary': '#8A9690', '--text-muted': '#6E7C73',
  '--accent-primary': '#79B37C', '--accent-eta': '#E3B15E', '--accent-critical': '#C15D4C',
};

export default function RouteDetailsPage() {
  const { routeId } = useParams();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [buses, setBuses] = useState([]);
  const [totalDistanceMeters, setTotalDistanceMeters] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState(null);

  function refresh() {
    setIsLoading(true);
    geofenceApi.getRouteDetail(routeId).then((data) => {
      setRoute(data.route);
      setStops(data.stops);
      setBuses(data.buses);
      setTotalDistanceMeters(data.totalDistanceMeters);
    }).finally(() => setIsLoading(false));
  }

  useEffect(() => { refresh(); }, [routeId]);

  async function handleSubmit(payload) {
    if (editingStop) {
      await geofenceApi.updateGeofence(editingStop._id, payload);
      showToast('Stop updated', 'success');
    } else {
      await geofenceApi.createGeofence({ ...payload, routeId });
      showToast('Stop added', 'success');
    }
    refresh();
  }

  async function handleDelete(stopId) {
    if (!window.confirm('Delete this stop?')) return;
    await geofenceApi.deleteGeofence(stopId);
    showToast('Stop deleted', 'success');
    refresh();
  }

  function openAdd() {
    setEditingStop(null);
    setModalOpen(true);
  }

  function openEdit(stop) {
    setEditingStop(stop);
    setModalOpen(true);
  }

  const path = stops.map((s) => [s.latitude, s.longitude]);
  const mapCenter = path.length > 0 ? path[0] : [25.4610, 68.7183];
  const tileUrl =
    theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  if (isLoading) {
    return (
      <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="min-h-[calc(100vh-64px)] p-4 sm:p-8">
        <div className="h-64 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface)' }} />
      </div>
    );
  }

  if (!route) {
    return (
      <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="min-h-[calc(100vh-64px)] p-4 sm:p-8">
        <p style={{ color: 'var(--accent-critical)' }}>Route not found.</p>
        <Link to="/devices" style={{ color: 'var(--accent-primary)' }}>← Back to Devices</Link>
      </div>
    );
  }

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="min-h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <Link to="/devices" className="text-sm" style={{ color: 'var(--accent-primary)' }}>
          ← Back to Devices
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-[19px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {route.name}
            </h1>
            <p className="text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
              {stops.length} stop{stops.length !== 1 ? 's' : ''} · {buses.length} bus{buses.length !== 1 ? 'es' : ''} on this route ·{' '}
              {(totalDistanceMeters / 1000).toFixed(2)} km total
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={openAdd}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-white flex-shrink-0"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              + Add Stop
            </button>
          )}
        </div>

        {/* Buses on this route */}
        {buses.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {buses.map((bus) => (
              <Link
                key={bus._id}
                to={`/devices/${bus._id}`}
                className="text-xs font-medium px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: bus.status === 'online' ? 'var(--accent-primary)1A' : 'var(--bg-surface)',
                  color: bus.status === 'online' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                🚌 {bus.name} {bus.status === 'online' ? '· Live' : ''}
              </Link>
            ))}
          </div>
        )}

        {stops.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '24px' }}>📍</span>
            <p className="text-sm mt-2">No stops configured for this route yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
            {/* Timeline */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Route timeline</h2>
              <div>
                {stops.map((stop, i) => (
                  <div key={stop._id} className="relative pl-8 pb-5 last:pb-0">
                    {i < stops.length - 1 && (
                      <div className="absolute left-[11px] top-6 w-0.5 h-full" style={{ backgroundColor: 'var(--border)' }} />
                    )}
                    <div
                      className="absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: stop.isStart || stop.isEnd ? 'var(--accent-primary)' : 'var(--accent-eta)' }}
                    >
                      {i + 1}
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {stop.name}
                          {stop.isStart && <span className="ml-2 text-[10px] font-medium" style={{ color: 'var(--accent-primary)' }}>START</span>}
                          {stop.isEnd && <span className="ml-2 text-[10px] font-medium" style={{ color: 'var(--accent-eta)' }}>DESTINATION</span>}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {i > 0 && `${(stop.distanceFromPrevMeters / 1000).toFixed(2)} km from previous · `}
                          Radius {stop.radiusMeters}m
                        </p>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => openEdit(stop)}
                            className="text-xs px-2 py-1 rounded-lg"
                            style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(stop._id)}
                            className="text-xs px-2 py-1 rounded-lg"
                            style={{ backgroundColor: 'var(--accent-critical)15', border: '1px solid var(--accent-critical)55', color: 'var(--accent-critical)' }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="rounded-2xl overflow-hidden" style={{ height: '460px', border: '1px solid var(--border)' }}>
              <MapContainer center={mapCenter} zoom={13} style={{ width: '100%', height: '100%' }}>
                <TileLayer url={tileUrl} />
                {path.length > 1 && (
                  <Polyline positions={path} pathOptions={{ color: tokens['--accent-primary'], weight: 4, dashArray: '8,6' }} />
                )}
                {stops.map((stop) => (
                  <Circle
                    key={stop._id}
                    center={[stop.latitude, stop.longitude]}
                    radius={stop.radiusMeters}
                    pathOptions={{
                      color: stop.isStart || stop.isEnd ? tokens['--accent-primary'] : tokens['--accent-eta'],
                      fillOpacity: 0.12,
                      weight: 2,
                    }}
                  >
                    <Tooltip>{stop.name}</Tooltip>
                  </Circle>
                ))}
                <MapSizeFix />
              </MapContainer>
            </div>
          </div>
        )}
      </div>

      {isAdmin && (
        <GeofenceFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          initialValues={editingStop}
          tokens={tokens}
        />
      )}
    </div>
  );
}