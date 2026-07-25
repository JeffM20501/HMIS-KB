import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as uploadsApi from '../api/uploads.api';

/**
 * Shared upload mutation used by the toolbar button, drag-and-drop,
 * and paste handlers so all three go through one code path (one place
 * to add e.g. size/type validation, progress, retry).
 */
export function useImageUpload({ onSuccess } = {}) {
  return useMutation({
    mutationFn: (file) => {
      if (!uploadsApi.isImageFile(file)) {
        return Promise.reject(new Error('That file is not an image.'));
      }
      if (file.size > 8 * 1024 * 1024) {
        return Promise.reject(new Error('Images must be under 8MB.'));
      }
      return uploadsApi.uploadImage(file);
    },
    onSuccess,
    onError: (err) => toast.error(err.message || 'Image upload failed. Please try again.'),
  });
}
