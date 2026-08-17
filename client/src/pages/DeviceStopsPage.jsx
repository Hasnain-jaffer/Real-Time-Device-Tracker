// client/src/pages/DeviceStopsPage.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import apiClient from '../lib/apiClient';
import { useGeofences } from '../features/geofences/hooks/useGeofences';
import GeofenceLayer from '../features/geofences/components/GeofenceLayer';
import GeofenceFormModal from '../features/geofences/components/GeofenceFormModal';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useToast } from '../app/ToastContext';
import { useAuth } from '../app/AuthContext';

export default function DeviceStopsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { showToast } = useToast();

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
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <Link to={`/devices/${id}`} className="text-sm text-primary hover:underline">
        ← Back to {device?.name || 'bus'}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{device?.name || 'Bus'} — Stops</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The route stops for this bus. You'll be notified when it arrives or leaves any of these.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="rounded-xl bg-primary text-white px-4 py-2 text-sm font-medium shadow-soft hover:bg-primary-600 transition flex-shrink-0"
          >
            + Add Stop
          </button>
        )}
      </div>

      {isLoading ? (
        <SkeletonCard />
      ) : geofences.length === 0 ? (
        <div className="glass rounded-2xl shadow-soft p-10 text-center text-gray-500 dark:text-gray-400">
          No stops set up for this bus yet.
        </div>
      ) : (
        <>
          <div className="h-72 rounded-2xl overflow-hidden shadow-soft">
            <MapContainer center={mapCenter} zoom={14} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <GeofenceLayer geofences={geofences} />
            </MapContainer>
          </div>

          <div className="space-y-3">
            {geofences.map((fence) => (
              <div key={fence._id} className="glass rounded-2xl shadow-soft p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: fence.color }} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{fence.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {fence.type} · {fence.radiusMeters}m radius
                    </p>
                  </div>
                </div>
                {isAdmin ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                      <input type="checkbox" checked={fence.isActive} onChange={() => handleToggleActive(fence)} />
                      Active
                    </label>
                    <button
                      onClick={() => {
                        setEditing(fence);
                        setModalOpen(true);
                      }}
                      className="text-xs rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(fence._id)}
                      className="text-xs rounded-lg border border-danger text-danger px-3 py-1.5 hover:bg-danger/10 transition"
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                      fence.isActive ? 'bg-success/10 text-success' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}
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
  );
}