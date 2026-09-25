// client/src/features/geofences/api/geofenceApi.js
import apiClient from '../../../lib/apiClient';

export function listGeofences(routeId) {
  return apiClient.get('/geofences', { params: routeId ? { routeId } : {} }).then((res) => res.data.geofences);
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

// --- Routes ---
export function listRoutes() {
  return apiClient.get('/routes').then((res) => res.data.routes);
}

export function getRouteDetail(routeId) {
  return apiClient.get(`/routes/${routeId}`).then((res) => res.data);
}

export function createRoute(payload) {
  return apiClient.post('/routes', payload).then((res) => res.data.route);
}

export function updateRoute(id, updates) {
  return apiClient.patch(`/routes/${id}`, updates).then((res) => res.data.route);
}

export function deleteRoute(id) {
  return apiClient.delete(`/routes/${id}`).then((res) => res.data);
}

export function assignBusToRoute(deviceId, routeId) {
  return apiClient.post(`/routes/device/${deviceId}/assign`, { routeId }).then((res) => res.data.device);
}