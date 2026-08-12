// client/src/features/analytics/api/analyticsApi.js
import apiClient from '../../../lib/apiClient';

export function getOverview(params = {}) {
  return apiClient.get('/analytics/overview', { params }).then((res) => res.data);
}

export function getDailyDistance(days = 7) {
  return apiClient.get('/analytics/daily-distance', { params: { days } }).then((res) => res.data.chartData);
}

export function getStopActivity() {
  return apiClient.get('/analytics/stop-activity').then((res) => res.data);
}