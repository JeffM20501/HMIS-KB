import * as mediaApi from './media.api';

/**
 * Editor-facing upload service. Wraps the real Django endpoint
 * (POST /api/v1/media/upload/, see media.api.js) behind a narrower,
 * upload-specific contract so editor components never talk to the
 * generic media API (or axios) directly.
 *
 * Returns a normalized { url, id, name } regardless of exactly which
 * field name the backend serializer uses (url / file / file_url) —
 * keeps every caller (image node, drag-drop, paste) from having to
 * know about that variance.
 */
export async function uploadImage(file, { onUploadProgress } = {}) {
  const data = await mediaApi.uploadMedia(file, { context: 'article-content' }, onUploadProgress);
  const url = data.url || data.file || data.file_url;
  if (!url) {
    throw new Error('Upload succeeded but the server response had no file URL.');
  }
  return { url, id: data.id, name: data.name || file.name };
}

export function isImageFile(file) {
  return !!file && file.type?.startsWith('image/');
}
