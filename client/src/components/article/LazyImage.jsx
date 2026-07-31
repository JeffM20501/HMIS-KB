import { useState } from 'react';
import ImageLightbox from './ImageLightbox.jsx';

/**
 * Renders every Markdown image (`![alt](url "optional caption")`).
 * react-markdown passes the Markdown `title` string through as the `title`
 * prop — we treat that as an optional caption line under the image, which
 * is the conventional Markdown way to express "this image has a caption"
 * without inventing new syntax.
 */
export default function LazyImage({ src, alt, title }) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <figure className="not-prose my-5 flex flex-col items-center">
      <img
        src={src}
        alt={alt || ''}
        loading="lazy"
        onClick={() => setZoomed(true)}
        className="rounded-lg border border-border max-w-full max-h-[520px] object-contain cursor-zoom-in hover:opacity-95 transition-opacity"
      />
      {title && <figcaption className="text-xs text-text-secondary mt-2 text-center">{title}</figcaption>}
      {zoomed && <ImageLightbox src={src} alt={alt} onClose={() => setZoomed(false)} />}
    </figure>
  );
}
