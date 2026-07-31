import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

/**
 * `headings` is the flat array from utils/headings.js (each item has
 * { id, text, depth } where depth is 2-4). Rendered flat with left-indent
 * driven by depth, which reads as a nested hierarchy without needing an
 * actual tree data structure — simpler to build and to keep in sync with
 * a flat scroll-spy pass.
 *
 * Active section is tracked via IntersectionObserver watching every
 * heading in the live document, rather than a scroll-position calculation
 * — cheaper (no scroll-event math on every frame) and correctly handles
 * short sections between two closely-spaced headings.
 */
export default function TableOfContents({ headings = [] }) {
  const [activeId, setActiveId] = useState(headings[0]?.id);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!headings.length) return undefined;

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean);

    if (!elements.length) return undefined;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 }
    );

    elements.forEach((el) => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  const handleClick = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Keep the URL shareable without fighting the smooth scroll.
    window.history.replaceState(null, '', `#${id}`);
    setActiveId(id);
  };

  return (
    <nav className="sticky top-24 space-y-0.5" aria-label="Table of contents">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">On this page</p>
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          onClick={(e) => handleClick(e, h.id)}
          style={{ paddingLeft: `${(h.depth - 2) * 12 + 12}px` }}
          className={clsx(
            'block text-sm py-1 border-l-2 transition-colors',
            activeId === h.id
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          )}
        >
          {h.text}
        </a>
      ))}
    </nav>
  );
}
