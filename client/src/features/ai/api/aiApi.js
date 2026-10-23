// client/src/features/ai/api/aiApi.js
import apiClient from '../../../lib/apiClient';

export function searchRoutesAI(query) {
  return apiClient.post('/ai/search', { query }).then((res) => res.data);
}