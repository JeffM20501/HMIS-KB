import { X, Plus } from "lucide-react";

export default function EditorForm({
  categories,
  type,
  title,
  slug,
  categoryId,
  tags,
  tagInput,
  onTitleChange,
  onSlugChange,
  onCategoryChange,
  onAddTag,
  onRemoveTag,
  onTagInputChange,
  isEditMode,
  onTemplateChange,
}) {
  return (
    <div className="bg-white rounded-lg border p-6 space-y-5" style={{ borderColor: "#E1E3EA" }}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "#FDEEF0", color: "#F22F46" }}>
          {type || "Article"}
        </span>
        {!isEditMode && (
          <button onClick={onTemplateChange} className="text-xs hover:underline" style={{ color: "#696E7A" }}>
            Change template
          </button>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Title <span style={{ color: "#F22F46" }}>*</span></label>
        <input value={title} onChange={onTitleChange} placeholder="e.g. How to reverse a discharge entry" className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none focus:border-red-500 transition-colors" style={{ borderColor: "#E1E3EA", color: "#121C2D" }} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Slug <span style={{ color: "#F22F46" }}>*</span></label>
        <input value={slug} onChange={(e) => onSlugChange(e.target.value)} placeholder="e.g. how-to-reverse-discharge" className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none focus:border-red-500 transition-colors" style={{ borderColor: "#E1E3EA", color: "#121C2D" }} />
        <p className="text-xs mt-1" style={{ color: "#9EA6B3" }}>The slug is used in the URL. It should be lowercase, hyphen-separated, and unique.</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Category <span style={{ color: "#F22F46" }}>*</span></label>
        <select value={categoryId} onChange={(e) => onCategoryChange(e.target.value)} className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none focus:border-red-500 transition-colors" style={{ borderColor: "#E1E3EA", color: "#121C2D" }}>
          <option value="">Select category…</option>
          {categories.map((c) => (
            <option key={c.id ?? c.slug} value={c.id ?? c.slug}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Tags</label>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {tags.map((t) => (
            <span key={t} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ background: "#F4F4F6", color: "#243656" }}>
              {t}
              <button onClick={() => onRemoveTag(t)}><X size={11} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={tagInput} onChange={(e) => onTagInputChange(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAddTag(); } }} placeholder="Add a tag and press Enter" className="flex-1 px-3.5 py-2 text-sm rounded-md border outline-none focus:border-red-500 transition-colors" style={{ borderColor: "#E1E3EA", color: "#121C2D" }} />
          <button onClick={onAddTag} type="button" className="flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium border transition-colors hover:bg-gray-50" style={{ borderColor: "#E1E3EA", color: "#243656" }}>
            <Plus size={13} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}