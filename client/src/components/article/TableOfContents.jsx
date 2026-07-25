export default function TableOfContents({ headings = [], activeId }) {
  if (!headings.length) return null;
  return (
    <nav className="sticky top-24 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">On this page</p>
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className={`block text-sm py-1 border-l-2 pl-3 transition-colors ${
            activeId === h.id ? 'border-primary text-primary font-medium' : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          {h.text}
        </a>
      ))}
    </nav>
  );
}
