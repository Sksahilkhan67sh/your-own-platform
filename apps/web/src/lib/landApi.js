import { api } from './apiClient.js';

// ---------- Public ----------

export async function fetchPublicLands(filters = {}) {
  const res = await api.get('/lands', { params: filters });
  return res.data; // { success, data: items[], meta }
}

export async function fetchPublicLandBySlug(slug) {
  const res = await api.get(`/lands/${slug}`);
  return res.data.data;
}

export async function fetchPublicSettings() {
  const res = await api.get('/settings/public');
  return res.data.data;
}

export async function postInquiry({ landId, messagePreview }) {
  // Fire-and-forget from the caller's perspective — the WhatsApp redirect
  // should never be blocked or delayed by this call failing.
  return api.post('/inquiries', { landId, messagePreview }).catch(() => null);
}

// ---------- Admin ----------

export async function fetchAdminLands(filters = {}) {
  const res = await api.get('/admin/lands', { params: filters });
  return res.data;
}

export async function fetchAdminLandById(id) {
  const res = await api.get(`/admin/lands/${id}`);
  return res.data.data; // { land, images }
}

export async function createLand(payload) {
  const res = await api.post('/admin/lands', payload);
  return res.data.data;
}

export async function updateLand(id, payload) {
  const res = await api.patch(`/admin/lands/${id}`, payload);
  return res.data.data;
}

export async function deleteLand(id) {
  await api.delete(`/admin/lands/${id}`);
}

export async function presignLandImages(landId, files) {
  const res = await api.post(`/admin/lands/${landId}/images/presign`, { files });
  return res.data.data; // [{ fileName, storageKey, uploadUrl, publicUrl, expiresInSeconds }]
}

export async function confirmLandImage(landId, payload) {
  const res = await api.post(`/admin/lands/${landId}/images/confirm`, payload);
  return res.data.data;
}

export async function deleteLandImage(landId, imageId) {
  await api.delete(`/admin/lands/${landId}/images/${imageId}`);
}

export async function reorderLandImages(landId, order) {
  await api.patch(`/admin/lands/${landId}/images/reorder`, { order });
}

export async function fetchAdminSettings() {
  const res = await api.get('/admin/settings');
  return res.data.data;
}

export async function updateAdminSettings(payload) {
  const res = await api.put('/admin/settings', payload);
  return res.data.data;
}
