import { api } from './apiClient.js';

export async function fetchAdminBranding() {
  const res = await api.get('/admin/branding');
  return res.data.data;
}

export async function updateAdminBranding(payload) {
  const res = await api.put('/admin/branding', payload);
  return res.data.data;
}

export async function presignBrandingUpload({ assetType, fileName, contentType, fileSizeBytes }) {
  const res = await api.post('/admin/branding/upload/presign', {
    assetType,
    fileName,
    contentType,
    fileSizeBytes,
  });
  return res.data.data;
}

export async function confirmBrandingUpload({ assetType, storageKey, publicUrl }) {
  const res = await api.post('/admin/branding/upload/confirm', { assetType, storageKey, publicUrl });
  return res.data.data;
}
