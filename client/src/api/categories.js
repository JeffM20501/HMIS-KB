import client from "./client";

/** GET /api/v1/categories/ */
/** GET /api/v1/categories/ */
export const listCategories = (params = {}) => client.get("/categories/", { params }).then((res) => res.data);

/** GET /api/v1/categories/:id/ — Get single category */
export const getCategory = (id) => client.get(`/categories/${id}/`).then((res) => res.data);

/** POST /api/v1/categories/ — admin only */
export const createCategory = (payload) => client.post("/categories/", payload).then((res) => res.data);

/** PATCH /api/v1/categories/:id/ — admin only */
export const updateCategory = (id, payload) =>
  client.patch(`/categories/${id}/`, payload).then((res) => res.data);

/** DELETE /api/v1/categories/:id/ — admin only */
export const deleteCategory = (id) => client.delete(`/categories/${id}/`).then((res) => res.data);

/** GET /api/v1/categories/root_categories/ */
export const getRootCategories = () => client.get("/categories/root_categories/").then((res) => res.data);

/** GET /api/v1/categories/:id/articles/ */
export const getCategoryArticles = (id) => client.get(`/categories/${id}/articles/`).then((res) => res.data);

/** GET /api/v1/tags/ */
export const listTags = (params = {}) => client.get("/tags/", { params }).then((res) => res.data);

/** POST /api/v1/tags/ — admin only */
export const createTag = (payload) => client.post("/tags/", payload).then((res) => res.data);

/** PATCH /api/v1/tags/:id/ */
export const updateTag = (id, payload) => client.patch(`/tags/${id}/`, payload).then((res) => res.data);

/** DELETE /api/v1/tags/:id/ */
export const deleteTag = (id) => client.delete(`/tags/${id}/`).then((res) => res.data);

/** GET /api/v1/tags/popular/ */
export const getPopularTags = () => client.get("/tags/popular/").then((res) => res.data);

/** GET /api/v1/tags/search/?q=... */
export const searchTags = (query) => client.get("/tags/search/", { params: { q: query } }).then((res) => res.data);

/**
 * Article-Tag junction (ArticleTagViewSet)
 * URLs: /api/v1/article-tag/
 */
export const listArticleTags = (articleId) =>
  client.get("/article-tag/", { params: { article: articleId } }).then((res) => res.data);

export const attachTagToArticle = (articleId, tagId) =>
  client.post("/article-tag/", { article: articleId, tag: tagId }).then((res) => res.data);

export const detachTagFromArticle = (articleTagId) =>
  client.delete(`/article-tag/${articleTagId}/`).then((res) => res.data);

/** POST /api/v1/article-tag/bulk-add/ */
export const bulkAddTags = (articleId, tagIds) =>
  client.post("/article-tag/bulk-add/", { article_id: articleId, tag_ids: tagIds }).then((res) => res.data);

/** POST /api/v1/article-tag/bulk-remove/ */
export const bulkRemoveTags = (articleId, tagIds) =>
  client.post("/article-tag/bulk-remove/", { article_id: articleId, tag_ids: tagIds }).then((res) => res.data);