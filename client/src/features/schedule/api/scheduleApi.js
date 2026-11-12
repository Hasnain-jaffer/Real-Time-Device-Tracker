// client/src/features/schedule/api/scheduleApi.js
import apiClient from '../../../lib/apiClient';

export function listDeviceSchedule(deviceId) {
  return apiClient.get(`/schedule/device/${deviceId}`).then(({ data }) => {
    const list = data?.schedule ?? data?.entries ?? data;
    if (!Array.isArray(list)) throw new Error('Unexpected schedule response from the server');
    return list;
  });
}

export function createScheduleEntry(payload) {
  return apiClient.post('/schedule', payload).then(({ data }) => data.entry ?? data);
}

export function updateScheduleEntry(id, updates) {
  return apiClient.patch(`/schedule/${id}`, updates).then(({ data }) => data.entry ?? data);
}

export function deleteScheduleEntry(id) {
  return apiClient.delete(`/schedule/${id}`).then(({ data }) => data);
}