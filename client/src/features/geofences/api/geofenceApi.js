// client/src/features/geofences/api/geofenceApi.js
import apiClient from '../../../lib/apiClient';

export function listGeofences(deviceId) {
  return apiClient
    .get('/geofences', { params: deviceId ? { deviceId } : {} })
    .then((res) => res.data.geofences);
}

export function createGeofence(payload) {
  return apiClient.post('/geofences', payload).then((res) => res.data.geofence);
}

export function updateGeofence(id, updates) {
  return apiClient.patch(`/geofences/${id}`, updates).then((res) => res.data.geofence);
}

export function deleteGeofence(id) {
  return apiClient.delete(`/geofences/${id}`).then((res) => res.data);
}