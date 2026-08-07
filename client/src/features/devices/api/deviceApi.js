// client/src/features/devices/api/deviceApi.js
import apiClient from '../../../lib/apiClient';

export function listDevices() {
  return apiClient.get('/devices').then((res) => res.data.devices);
}

export function createDevice({ name, identifier, type }) {
  return apiClient.post('/devices', { name, identifier, type }).then((res) => res.data.device);
}

export function updateDevice(id, updates) {
  return apiClient.patch(`/devices/${id}`, updates).then((res) => res.data.device);
}

export function deleteDevice(id) {
  return apiClient.delete(`/devices/${id}`).then((res) => res.data);
}

export function regenerateDeviceKey(id) {
  return apiClient.post(`/devices/${id}/regenerate-key`).then((res) => res.data.device);
}