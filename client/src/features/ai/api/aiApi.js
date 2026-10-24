import apiClient from '../../../lib/apiClient';

export function searchRoutesAI(query) {
  return apiClient.post('/ai/search', { query }).then((res) => res.data);
}

export function getDelayNote(deviceId) {
  return apiClient.get(`/ai/delay-note/${deviceId}`).then((res) => res.data);
}