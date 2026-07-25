import api from './axios';

// GET /api/v1/categories/
export const listCategories = (params) => api.get('/categories/', { params }).then((r) => r.data);

// GET /api/v1/categories/root_categories/  (top-level tree for nav/sidebar)
export const getRootCategories = () => api.get('/categories/root_categories/').then((r) => r.data);

// GET /api/v1/categories/:id/
export const getCategory = (id) => api.get(`/categories/${id}/`).then((r) => r.data);

// GET /api/v1/categories/:id/articles/
export const getCategoryArticles = (id, params) =>
  api.get(`/categories/${id}/articles/`, { params }).then((r) => r.data);

// POST /api/v1/categories/
export const createCategory = (payload) => api.post('/categories/', payload).then((r) => r.data);

// PATCH /api/v1/categories/:id/
export const updateCategory = (id, payload) => api.patch(`/categories/${id}/`, payload).then((r) => r.data);

// DELETE /api/v1/categories/:id/
export const deleteCategory = (id) => api.delete(`/categories/${id}/`).then((r) => r.data);
