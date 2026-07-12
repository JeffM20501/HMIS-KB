import client from "./client";

/** GET /api/v1/articles/ */
export const listArticles = (params = {}) => client.get("/articles/", { params }).then((res) => res.data);

/** GET /api/v1/articles/:slug/ (lookup_field='slug') */
export const getArticle = (slug) => client.get(`/articles/${slug}/`).then((res) => res.data);

/** Search: reuse list endpoint with `search` param */
export const searchArticles = (q, params = {}) => listArticles({ search: q, ...params });

/** POST /api/v1/articles/ */
export const createArticle = (payload) => client.post("/articles/", payload).then((res) => res.data);

/** PATCH /api/v1/articles/:slug/ */
export const updateArticle = (slug, payload) =>
  client.patch(`/articles/${slug}/`, payload).then((res) => res.data);

/** DELETE /api/v1/articles/:slug/ */
export const deleteArticle = (slug) => client.delete(`/articles/${slug}/`).then((res) => res.data);

/** POST /api/v1/articles/:slug/submit_for_review/ */
export const submitArticleForReview = (slug) =>
  client.post(`/articles/${slug}/submit_for_review/`).then((res) => res.data);

/** POST /api/v1/articles/:slug/publish/ */
export const publishArticle = (slug) => client.post(`/articles/${slug}/publish/`).then((res) => res.data);

/** POST /api/v1/articles/:slug/reject/ */
export const rejectArticle = (slug, reason) =>
  client.post(`/articles/${slug}/reject/`, { reason }).then((res) => res.data);

/** GET /api/v1/articles/my_articles/ */
export const getMyArticles = (params = {}) =>
  client.get("/articles/my_articles/", { params }).then((res) => res.data);

/** GET /api/v1/articles/pending_review/ (admin only) */
export const getPendingArticles = (params = {}) =>
  client.get("/articles/pending_review/", { params }).then((res) => res.data);

/**
 * POST /api/v1/media/upload/ - MediaViewSet custom action
 * This is the main upload endpoint.
 */
export const uploadArticleMedia = (articleId, file, onUploadProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("article_id", articleId); // article_id is a field in MediaUploadSerializer
  return client
    .post("/media/upload/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    })
    .then((res) => res.data);
};

/** GET /api/v1/media/?article_id=:id */
export const listArticleMedia = (articleId) =>
  client.get("/media/", { params: { article_id: articleId } }).then((res) => res.data);

/** DELETE /api/v1/media/:id/delete_file/ */
export const deleteArticleMedia = (mediaId) =>
  client.delete(`/media/${mediaId}/delete_file/`).then((res) => res.data);

/** GET /api/v1/media/article_media/?article_id=:id */
export const getArticleMedia = (articleId) =>
  client.get("/media/article_media/", { params: { article_id: articleId } }).then((res) => res.data);