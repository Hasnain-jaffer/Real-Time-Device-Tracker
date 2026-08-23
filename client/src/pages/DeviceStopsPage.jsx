// client/src/pages/DeviceStopsPage.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import apiClient from '../lib/apiClient';
import { useGeofences } from '../features/geofences/hooks/useGeofences';
import GeofenceLayer from '../features/geofences/components/GeofenceLayer';
import GeofenceFormModal from '../features/geofences/components/GeofenceFormModal';
import MapSizeFix from '../components/map/MapSizeFix';
import { useToast } from '../app/ToastContext';
import { useAuth } from '../app/AuthContext';
import { useTheme } from '../app/ThemeContext';


const lightTokens = {
  '--bg-page': '#F4EFE6', '--bg-surface': '#FFFFFF', '--border': '#E1D9C8',
  '--text-primary': '#173B32', '--text-secondary': '#5B6B5F', '--text-muted': '#9C8F73',
  '--accent-primary': '#5E8C61', '--accent-critical': '#B94A3A',
  '--badge-success-bg': '#EAF3DE', '--badge-success-text': '#3B6D26',
};

const darkTokens = {
  '--bg-page': '#12181A', '--bg-surface': '#182220', '--border': '#263531',
  '--text-primary': '#F1EEE4', '--text-secondary': '#8A9690', '--text-muted': '#6E7C73',
  '--accent-primary': '#79B37C', '--accent-critical': '#C15D4C',
  '--badge-success-bg': 'rgba(94,140,97,0.15)', '--badge-success-text': '#79B37C',
};

export default function DeviceStopsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isAdmin = user?.role === 'admin';
  const { showToast } = useToast();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  const [device, setDevice] = useState(null);
  const { geofences, isLoading, addGeofence, editGeofence, removeGeofence } = useGeofences(id);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    apiClient.get(`/devices/${id}`).then(({ data }) => setDevice(data.device));
  }, [id]);

  async function handleSubmit(payload) {
    if (editing) {
      await editGeofence(editing._id, payload);
      showToast('Stop updated', 'success');
    } else {
      await addGeofence(payload);
      showToast('Stop added', 'success');
    }
  }

  async function handleDelete(fenceId) {
    if (!confirm('Delete this stop?')) return;
    await removeGeofence(fenceId);
    showToast('Stop deleted', 'success');
  }

  async function handleToggleActive(fence) {
    await editGeofence(fence._id, { isActive: !fence.isActive });
  }

  const mapCenter = geofences.length > 0
    ? [geofences[0].latitude, geofences[0].longitude]
    : device?.lastLocation?.latitude
      ? [device.lastLocation.latitude, device.lastLocation.longitude]
      : [25.4610, 68.7183];

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <Link to={`/devices/${id}`} className="text-sm" style={{ color: 'var(--accent-primary)' }}>
          ← Back to {device?.name || 'bus'}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-[19px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {device?.name || 'Bus'} — Stops
            </h1>
            <p className="text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
              The route stops for this bus. You'll be notified when it arrives or leaves any of these.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-white flex-shrink-0"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              + Add stop
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="h-40 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface)' }} />
        ) : geofences.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '24px' }}>📍</span>
            <p className="text-sm mt-2">No stops set up for this bus yet.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl overflow-hidden" style={{ height: '280px', border: '1px solid var(--border)' }}>
              <MapContainer center={mapCenter} zoom={14} style={{ width: '100%', height: '100%' }}>
                <TileLayer
                  url={
                    theme === 'dark'
                      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                  }
                />
                <GeofenceLayer geofences={geofences} />
                <MapSizeFix />
              </MapContainer>
            </div>

            <div className="space-y-2.5">
              {geofences.map((fence) => (
                <div
                  key={fence._id}
                  className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: fence.color }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{fence.name}</p>
                      <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                        {fence.type} · {fence.radiusMeters}m radius
                      </p>
                    </div>
                  </div>
                  {isAdmin ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none" style={{ color: 'var(--text-secondary)' }}>
                        <input type="checkbox" checked={fence.isActive} onChange={() => handleToggleActive(fence)} />
                        Active
                      </label>
                      <button
                        onClick={() => {
                          setEditing(fence);
                          setModalOpen(true);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(fence._id)}
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: 'var(--accent-critical)15', border: '1px solid var(--accent-critical)55', color: 'var(--accent-critical)' }}
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                      style={
                        fence.isActive
                          ? { backgroundColor: 'var(--badge-success-bg)', color: 'var(--badge-success-text)' }
                          : { backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)' }
                      }
                    >
                      {fence.isActive ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {isAdmin && (
          <GeofenceFormModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSubmit={handleSubmit}
            initialValues={editing}
          />
        )}
      </div>
    </div>
  );
}