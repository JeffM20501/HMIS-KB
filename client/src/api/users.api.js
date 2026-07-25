import api from './axios';

// GET /api/v1/u/users/me/
export const getCurrentUser = () => api.get('/u/users/me/').then((r) => r.data);

// PATCH /api/v1/u/users/me/  (some DRF setups also allow PATCH on me/)
export const updateProfile = (userId, payload) => api.patch(`/u/users/${userId}/`, payload).then((r) => r.data);

// GET /api/v1/u/users/dashboard/  (editor "my stats" dashboard)
export const getMyDashboard = () => api.get('/u/users/dashboard/').then((r) => r.data);

// GET /api/v1/u/users/admin_dashboard/
export const getAdminDashboard = () => api.get('/u/users/admin_dashboard/').then((r) => r.data);

// GET /api/v1/u/users/admin_users/  (denser admin listing, e.g. with article counts)
export const getAdminUsers = (params) => api.get('/u/users/admin_users/', { params }).then((r) => r.data);

// GET /api/v1/u/users/  -> paginated list, supports ?search=&role=&status=&page=
export const listUsers = (params) => api.get('/u/users/', { params }).then((r) => r.data);

// GET /api/v1/u/users/:id/
export const getUser = (id) => api.get(`/u/users/${id}/`).then((r) => r.data);

// POST /api/v1/u/users/  (invite user)
export const createUser = (payload) => api.post('/u/users/', payload).then((r) => r.data);

// PATCH /api/v1/u/users/:id/
export const patchUser = (id, payload) => api.patch(`/u/users/${id}/`, payload).then((r) => r.data);

// DELETE /api/v1/u/users/:id/
export const deleteUser = (id) => api.delete(`/u/users/${id}/`).then((r) => r.data);

// POST /api/v1/u/users/:id/change_role/  { role: 'admin' | 'editor' | 'viewer' }
export const changeUserRole = (id, role) => api.post(`/u/users/${id}/change_role/`, { role }).then((r) => r.data);

// POST /api/v1/u/users/:id/set_password/
export const setUserPassword = (id, password) =>
  api.post(`/u/users/${id}/set_password/`, { password }).then((r) => r.data);

// POST /api/v1/u/users/:id/update_avatar/  (multipart/form-data)
export const updateAvatar = (id, file) => {
  const form = new FormData();
  form.append('avatar', file);
  return api
    .post(`/u/users/${id}/update_avatar/`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);
};
