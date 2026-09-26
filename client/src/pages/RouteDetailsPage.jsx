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

/* ─── SVG Icons ─── */
const IconBus = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M6 18v2" /><path d="M18 18v2" /><path d="M6 10h12" />
    <circle cx="7.5" cy="18" r="0.5" fill="currentColor" />
    <circle cx="16.5" cy="18" r="0.5" fill="currentColor" />
  </svg>
);

const IconPlus = ({ size = 15, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconEdit = ({ size = 12, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconTrash = ({ size = 12, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconMapPin = ({ size = 24, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const IconArrowLeft = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconTimeline = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
  </svg>
);

const IconRoute = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" /><line x1="12" y1="19" x2="20" y2="5" />
  </svg>
);

/* ─── Tokens ─── */
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

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

const TILES = {
  normal: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

export default function RouteDetailsPage() {
  const { routeId } = useParams();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin';
  const tokens = theme === 'dark' ? darkTokens : lightTokens;
  const isDark = theme === 'dark';

  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [buses, setBuses] = useState([]);
  const [totalDistanceMeters, setTotalDistanceMeters] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState(null);
  const [mapLayer, setMapLayer] = useState('normal'); // 'normal' | 'satellite' | 'dark'

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

  const tileUrl = mapLayer === 'satellite' ? TILES.satellite : TILES.normal;
  const mapWrapperClass = mapLayer === 'dark' || (isDark && mapLayer === 'normal') ? 'dark-map' : '';

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
        <Link to="/devices" className="flex items-center gap-1 text-sm mt-2" style={{ color: 'var(--accent-primary)' }}>
          <IconArrowLeft size={14} />
          Back to Devices
        </Link>
      </div>
    );
  }

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="min-h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <Link to="/devices" className="flex items-center gap-1 text-sm w-fit" style={{ color: 'var(--accent-primary)' }}>
          <IconArrowLeft size={14} />
          Back to Devices
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
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white flex-shrink-0 transition hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: 'var(--accent-primary)', boxShadow: cardShadow }}
            >
              <IconPlus size={15} />
              Add Stop
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
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition hover:opacity-90"
                style={{
                  backgroundColor: bus.status === 'online' ? 'var(--accent-primary)' + '1A' : 'var(--bg-surface)',
                  color: bus.status === 'online' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                <IconBus size={13} />
                {bus.name}
                {bus.status === 'online' && (
                  <span className="flex items-center gap-1 text-[10px] font-bold">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    />
                    Live
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

        {stops.length === 0 ? (
          <div
            className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              <IconMapPin size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                No stops configured for this route yet.
              </p>
              {isAdmin && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Click "Add Stop" above to build the route.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
            {/* Timeline */}
            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--accent-primary)' + '15', color: 'var(--accent-primary)' }}
                >
                  <IconTimeline size={13} />
                </span>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Route timeline</h2>
              </div>
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
                      {stop.isStart ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      ) : stop.isEnd ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {stop.name}
                          {stop.isStart && (
                            <span
                              className="ml-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: 'var(--accent-primary)' + '15', color: 'var(--accent-primary)' }}
                            >
                              Start
                            </span>
                          )}
                          {stop.isEnd && (
                            <span
                              className="ml-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: 'var(--accent-eta)' + '15', color: 'var(--accent-eta)' }}
                            >
                              Destination
                            </span>
                          )}
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
                            className="flex items-center gap-1 text-[11px] font-medium px-2 py-1.5 rounded-lg transition hover:opacity-80"
                            style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                          >
                            <IconEdit size={11} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(stop._id)}
                            className="flex items-center gap-1 text-[11px] font-medium px-2 py-1.5 rounded-lg transition hover:opacity-80"
                            style={{ backgroundColor: 'var(--accent-critical)' + '10', border: '1px solid var(--accent-critical)' + '55', color: 'var(--accent-critical)' }}
                          >
                            <IconTrash size={11} />
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
            <div
              className={`relative rounded-2xl overflow-hidden ${mapWrapperClass}`}
              style={{ height: '460px', border: '1px solid var(--border)', boxShadow: cardShadow }}
            >
              <MapContainer center={mapCenter} zoom={13} style={{ width: '100%', height: '100%' }} attributionControl={false}>
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
                      fillColor: stop.isStart || stop.isEnd ? tokens['--accent-primary'] : tokens['--accent-eta'],
                      fillOpacity: 0.12,
                      weight: 2,
                    }}
                  >
                    <Tooltip permanent={false} direction="top" offset={[0, -10]}>
                      <span className="text-xs font-semibold">{stop.name}</span>
                    </Tooltip>
                  </Circle>
                ))}
                <MapSizeFix />
              </MapContainer>

              {/* Layer switcher */}
              <div
                className="absolute top-3 right-3 z-[500] flex flex-col gap-1 rounded-xl p-1"
                style={{
                  backgroundColor: isDark ? 'rgba(24,34,32,0.9)' : 'rgba(255,255,255,0.95)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  boxShadow: cardShadow,
                  backdropFilter: 'blur(8px)',
                }}
              >
                {[
                  { key: 'normal', label: 'Map' },
                  { key: 'satellite', label: 'Sat' },
                  { key: 'dark', label: 'Dark' },
                ].map((layer) => (
                  <button
                    key={layer.key}
                    onClick={() => setMapLayer(layer.key)}
                    className="rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all"
                    style={{
                      backgroundColor: mapLayer === layer.key ? 'var(--accent-primary)' : 'transparent',
                      color: mapLayer === layer.key ? '#fff' : 'var(--text-primary)',
                    }}
                  >
                    {layer.label}
                  </button>
                ))}
              </div>

              {/* Distance badge */}
              <div
                className="absolute bottom-3 left-3 z-[500] text-[11px] font-semibold px-3.5 py-1.5 rounded-full backdrop-blur-md border flex items-center gap-1.5"
                style={{
                  backgroundColor: isDark ? 'rgba(24,34,32,0.85)' : 'rgba(255,255,255,0.9)',
                  color: isDark ? '#F1EEE4' : '#173B32',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  boxShadow: cardShadow,
                }}
              >
                <IconRoute size={12} />
                {(totalDistanceMeters / 1000).toFixed(2)} km
              </div>
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