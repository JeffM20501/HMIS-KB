import api from './axios';

// GET /api/v1/media/
export const listMedia = (params) => api.get('/media/', { params }).then((r) => r.data);

// GET /api/v1/media/article_media/?article=:id
export const getArticleMedia = (articleId) =>
  api.get('/media/article_media/', { params: { article: articleId } }).then((r) => r.data);

// POST /api/v1/media/upload/  (multipart/form-data) — used by the rich text editor for images/attachments
export const uploadMedia = (file, meta = {}, onUploadProgress) => {
  const form = new FormData();
  form.append('file', file);
  Object.entries(meta).forEach(([k, v]) => form.append(k, v));
  return api
    .post('/media/upload/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
    .then((r) => r.data);
};

// DELETE /api/v1/media/:id/delete_file/
export const deleteMediaFile = (id) => api.delete(`/media/${id}/delete_file/`).then((r) => r.data);
