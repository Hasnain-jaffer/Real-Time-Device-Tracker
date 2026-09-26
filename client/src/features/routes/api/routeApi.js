// client/src/features/routes/api/routeApi.js
import apiClient from '../../../lib/apiClient';

export function listRoutes() {
  return apiClient.get('/routes').then((res) => res.data.routes);
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