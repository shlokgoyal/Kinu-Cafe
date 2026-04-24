import { apiClient } from './client';

const get = (url, params) => apiClient.get(url, { params }).then((r) => r.data);
const post = (url, body) => apiClient.post(url, body).then((r) => r.data);
const put = (url, body) => apiClient.put(url, body).then((r) => r.data);
const patch = (url, body) => apiClient.patch(url, body).then((r) => r.data);
const del = (url) => apiClient.delete(url).then((r) => r.data);

export const authApi = {
  login: (email, password) => post('/auth/admin/login', { email, password }),
  me: () => get('/auth/me'),
  updateMe: (body) => put('/auth/me', body),
  changePassword: (currentPassword, newPassword) =>
    put('/auth/me/password', { currentPassword, newPassword }),
  logout: () => post('/auth/logout'),
};

export const dashboardApi = {
  stats: () => get('/admin/dashboard/stats'),
};

export const ordersApi = {
  list: (params) => get('/admin/orders', params),
  get: (id) => get(`/admin/orders/${id}`),
  updateStatus: (id, status) => patch(`/admin/orders/${id}/status`, { status }),
  bill: (id, body) => post(`/admin/orders/${id}/bill`, body),
  pay: (id, method) => post(`/admin/orders/${id}/pay`, { method }),
  cancel: (id) => patch(`/admin/orders/${id}/cancel`),
};

export const menuApi = {
  list: (params) => get('/admin/menu/items', params),
  get: (id) => get(`/admin/menu/items/${id}`),
  create: (body) => post('/admin/menu/items', body),
  update: (id, body) => put(`/admin/menu/items/${id}`, body),
  toggleAvailability: (id, isAvailable) =>
    patch(`/admin/menu/items/${id}/availability`, { isAvailable }),
  remove: (id) => del(`/admin/menu/items/${id}`),
};

export const categoriesApi = {
  list: () => get('/admin/categories'),
  create: (body) => post('/admin/categories', body),
  update: (id, body) => put(`/admin/categories/${id}`, body),
  remove: (id) => del(`/admin/categories/${id}`),
};

export const tablesApi = {
  list: () => get('/admin/tables'),
  get: (id) => get(`/admin/tables/${id}`),
  create: (body) => post('/admin/tables', body),
  update: (id, body) => put(`/admin/tables/${id}`, body),
  regenerateQr: (id) => post(`/admin/tables/${id}/regenerate-qr`),
  remove: (id) => del(`/admin/tables/${id}`),
};

export const couponsApi = {
  list: (params) => get('/admin/coupons', params),
  get: (id) => get(`/admin/coupons/${id}`),
  create: (body) => post('/admin/coupons', body),
  update: (id, body) => put(`/admin/coupons/${id}`, body),
  remove: (id) => del(`/admin/coupons/${id}`),
};

export const reservationsApi = {
  list: (params) => get('/admin/reservations', params),
  update: (id, body) => patch(`/admin/reservations/${id}`, body),
};

export const usersApi = {
  list: (params) => get('/admin/users', params),
  get: (id) => get(`/admin/users/${id}`),
  create: (body) => post('/admin/users', body),
  update: (id, body) => patch(`/admin/users/${id}`, body),
  remove: (id) => del(`/admin/users/${id}`),
};

export const analyticsApi = {
  sales: (params) => get('/admin/analytics/sales', params),
  topItems: (params) => get('/admin/analytics/top-items', params),
  customers: () => get('/admin/analytics/customers'),
};

export const settingsApi = {
  get: () => get('/admin/settings'),
  update: (body) => put('/admin/settings', body),
};
