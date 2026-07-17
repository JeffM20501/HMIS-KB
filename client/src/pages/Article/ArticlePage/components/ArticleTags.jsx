// src/pages/ArticlePage/ArticleTags.jsx
import { Tag } from "lucide-react";

export default function ArticleTags({ tags, tagMap }) {
  if (!tags?.length) return null;

  // Helper: resolve tag name from ID or object
  const resolveTag = (tag) => {
    if (typeof tag === "object") return { key: tag.id, name: tag.name };
    return { key: tag, name: tagMap?.[tag] || `Tag ${tag}` };
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t" style={{ borderColor: "#E8E8EC" }}>
      <Tag size={13} style={{ color: "#9EA6B3" }} />
      {tags.map((tag) => {
        const { key, name } = resolveTag(tag);
        return (
          <span
            key={key}
            className="text-xs px-2.5 py-1 rounded-full"
            style={{ background: "#F4F4F6", color: "#696E7A" }}
          >
            {name}
          </span>
        );
      })}
    </div>
  );
}