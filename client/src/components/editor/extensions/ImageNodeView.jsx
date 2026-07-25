import { useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { useMutation } from '@tanstack/react-query';
import { Trash2, Replace, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as uploadsApi from '../../../api/uploads.api';

export default function ImageNodeView({ node, updateAttributes, deleteNode, editor }) {
  const fileInputRef = useRef(null);

  const replaceMutation = useMutation({
    mutationFn: (file) => uploadsApi.uploadImage(file),
    onSuccess: ({ url, name }) => updateAttributes({ src: url, alt: name }),
    onError: (err) => toast.error(err.message || 'Could not replace image.'),
  });

  const handleReplace = (e) => {
    const file = e.target.files?.[0];
    if (file) replaceMutation.mutate(file);
    e.target.value = '';
  };

  return (
    <NodeViewWrapper className="relative inline-block group max-w-full my-2">
      <img
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        className="rounded-lg max-w-full max-h-[420px] border border-border"
      />

      {editor?.isEditable && (
        <div
          contentEditable={false}
          className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 bg-white/95 border border-border rounded-full shadow-card px-1 py-0.5"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={replaceMutation.isPending}
            title="Replace image"
            className="w-7 h-7 rounded-full flex items-center justify-center text-text-secondary hover:bg-gray-100"
          >
            {replaceMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Replace className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={deleteNode}
            title="Delete image"
            className="w-7 h-7 rounded-full flex items-center justify-center text-text-secondary hover:bg-danger-bg hover:text-danger"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReplace} />
        </div>
      )}
    </NodeViewWrapper>
  );
}
