import api from './axios';

// GET /api/v1/articles/  -> supports ?search=&category=&tag=&status=&module=&ordering=&page=
export const listArticles = (params) => api.get('/articles/', { params }).then((r) => r.data);

// GET /api/v1/articles/:slug/
export const getArticle = (slug) => api.get(`/articles/${slug}/`).then((r) => r.data);

// POST /api/v1/articles/
export const createArticle = (payload) => api.post('/articles/', payload).then((r) => r.data);

// PATCH /api/v1/articles/:slug/
export const updateArticle = (slug, payload) => api.patch(`/articles/${slug}/`, payload).then((r) => r.data);

// DELETE /api/v1/articles/:slug/  (soft delete / archive per FR-1.7)
export const deleteArticle = (slug) => api.delete(`/articles/${slug}/`).then((r) => r.data);

// POST /api/v1/articles/:slug/submit_for_review/
export const submitForReview = (slug) => api.post(`/articles/${slug}/submit_for_review/`).then((r) => r.data);

// POST /api/v1/articles/:slug/publish/
export const publishArticle = (slug) => api.post(`/articles/${slug}/publish/`).then((r) => r.data);

// POST /api/v1/articles/:slug/reject/  { reason }
export const rejectArticle = (slug, reason) => api.post(`/articles/${slug}/reject/`, { reason }).then((r) => r.data);

// GET /api/v1/articles/my_articles/
export const getMyArticles = (params) => api.get('/articles/my_articles/', { params }).then((r) => r.data);

// GET /api/v1/articles/pending_review/
export const getPendingReview = (params) => api.get('/articles/pending_review/', { params }).then((r) => r.data);

// GET /api/v1/stats/  (public homepage stats: total articles, categories, etc.)
export const getPublicStats = () => api.get('/stats/').then((r) => r.data);


export const getArticleTrend = () => api.get('/articles/creation_trend/').then((r) => r.data);

export const getArticleMedia = (slug) =>
    api.get(`/articles/${slug}/media/`).then((r) => r.data);

export const deleteMedia = (mediaId) =>
    api.delete(`/articles/media/${mediaId}/`).then((r) => r.data);