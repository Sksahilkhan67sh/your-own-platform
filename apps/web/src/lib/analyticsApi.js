import { api } from './apiClient.js';

export async function fetchLandAnalytics(landId, { radiusKm } = {}) {
  const res = await api.get(`/analytics/land/${landId}`, {
    params: radiusKm ? { radius: radiusKm } : undefined,
  });
  return res.data.data;
}

export async function fetchLocationAnalytics({ latitude, longitude, radiusKm }) {
  const res = await api.get('/analytics/location', {
    params: { latitude, longitude, radius: radiusKm },
  });
  return res.data.data;
}

// ---------- Admin: Analytics Management ----------

export async function fetchAdminAnalyticsSettings() {
  const res = await api.get('/admin/analytics/settings');
  return res.data.data;
}

export async function updateAdminAnalyticsSettings(payload) {
  const res = await api.put('/admin/analytics/settings', payload);
  return res.data.data;
}
