import api from './axios';

// GET /api/v1/tags/
export const listTags = (params) => api.get('/tags/', { params }).then((r) => r.data);

// GET /api/v1/tags/popular/
export const getPopularTags = () => api.get('/tags/popular/').then((r) => r.data);

// GET /api/v1/tags/search/?q=
export const searchTags = (query) => api.get('/tags/search/', { params: { q: query } }).then((r) => r.data);

// GET /api/v1/tags/:id/articles/
export const getTagArticles = (id, params) => api.get(`/tags/${id}/articles/`, { params }).then((r) => r.data);

// POST /api/v1/tags/
export const createTag = (payload) => api.post('/tags/', payload).then((r) => r.data);

// --- Article <-> Tag relation (article-tag/) ---
// POST /api/v1/article-tag/bulk-add/  { article, tags: [ids] }
export const bulkAddTags = (payload) => api.post('/article-tag/bulk-add/', payload).then((r) => r.data);

// POST /api/v1/article-tag/bulk-remove/
export const bulkRemoveTags = (payload) => api.post('/article-tag/bulk-remove/', payload).then((r) => r.data);
