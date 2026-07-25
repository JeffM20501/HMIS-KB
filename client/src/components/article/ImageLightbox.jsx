import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6 cursor-zoom-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Image preview'}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10"
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>
      <img src={src} alt={alt} className="max-w-full max-h-full rounded-lg" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
