import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Plugin } from '@tiptap/pm/state';
import toast from 'react-hot-toast';
import ImageNodeView from './ImageNodeView.jsx';
import * as uploadsApi from '../../../api/uploads.api';

/**
 * Uploads immediately and inserts the *real* backend URL — never a blob:
 * or data: URL. If a base64 image ever ended up in Markdown content, it
 * would bloat every article payload and make embeddings/RAG chunking on
 * that content actively harmful (see project ADR in ArticleEditorPage).
 */
function uploadAndInsert(view, file, pos) {
  if (!uploadsApi.isImageFile(file)) return;

  const toastId = toast.loading('Uploading image…');
  uploadsApi
    .uploadImage(file)
    .then(({ url, name }) => {
      toast.dismiss(toastId);
      const { schema, tr } = view.state;
      const node = schema.nodes.image.create({ src: url, alt: name });
      const insertPos = pos ?? view.state.selection.from;
      view.dispatch(tr.insert(insertPos, node));
    })
    .catch((err) => {
      toast.dismiss(toastId);
      toast.error(err.message || 'Image upload failed.');
    });
}

/**
 * Extends the base Image extension with:
 *  - a React NodeView for hover controls (replace / delete)
 *  - a ProseMirror plugin that intercepts paste and drop events carrying
 *    image files, uploads them, and inserts the resulting node — this is
 *    what makes "paste a screenshot" and "drag a file onto the editor"
 *    work without ever touching base64.
 */
export const UploadImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },

  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() || []),
      new Plugin({
        props: {
          handlePaste(view, event) {
            const files = Array.from(event.clipboardData?.files || []);
            const images = files.filter((f) => f.type.startsWith('image/'));
            if (!images.length) return false;
            event.preventDefault();
            images.forEach((file) => uploadAndInsert(view, file));
            return true;
          },
          handleDrop(view, event) {
            const files = Array.from(event.dataTransfer?.files || []);
            const images = files.filter((f) => f.type.startsWith('image/'));
            if (!images.length) return false;
            event.preventDefault();
            const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
            images.forEach((file) => uploadAndInsert(view, file, coords?.pos));
            return true;
          },
        },
      }),
    ];
  },
});

export default UploadImage;
