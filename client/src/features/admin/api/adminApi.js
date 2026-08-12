// client/src/features/admin/api/adminApi.js
import apiClient from '../../../lib/apiClient';

export function getOverview() {
  return apiClient.get('/admin/overview').then((res) => res.data);
}

export function listUsers(search = '') {
  return apiClient.get('/admin/users', { params: { search } }).then((res) => res.data.users);
}

export function suspendUser(id) {
  return apiClient.patch(`/admin/users/${id}/suspend`).then((res) => res.data.user);
}

export function activateUser(id) {
  return apiClient.patch(`/admin/users/${id}/activate`).then((res) => res.data.user);
}

export function deleteUser(id) {
  return apiClient.delete(`/admin/users/${id}`).then((res) => res.data);
}

export function listAllDevices() {
  return apiClient.get('/admin/devices').then((res) => res.data.devices);
}

export function adminDeleteDevice(id) {
  return apiClient.delete(`/admin/devices/${id}`).then((res) => res.data);
}

export function adminToggleTracking(id, trackingEnabled) {
  return apiClient.patch(`/admin/devices/${id}/tracking`, { trackingEnabled }).then((res) => res.data.device);
}