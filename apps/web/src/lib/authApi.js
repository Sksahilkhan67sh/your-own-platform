import { api } from './apiClient.js';

export async function loginRequest({ email, password }) {
  const res = await api.post('/auth/login', { email, password });
  return res.data.data; // { accessToken, user }
}

export async function logoutRequest() {
  await api.post('/auth/logout');
}

export async function fetchCurrentUser() {
  const res = await api.get('/auth/me');
  return res.data.data.user;
}
