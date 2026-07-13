import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Save, Send, CheckCircle2, Loader2, X, Plus,
  FileQuestion, ClipboardList, HelpCircle, Wrench, BookMarked, Rss,
} from "lucide-react";
import {
  createArticle, updateArticle, getArticle, submitArticleForReview,
  publishArticle, uploadArticleMedia, deleteArticleMedia,
} from "../api/articles";
import { listCategories } from "../api/categories";
import RichTextEditor from "../components/editor/RichTextEditor.jsx";
import MediaUploader from "../components/editor/MediaUploader.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import Spinner from "../components/common/Spinner.jsx";
import useAuth from "../hooks/useAuth";
import { ARTICLE_TYPES, ARTICLE_TYPE_LABELS, TEMPLATE_SECTIONS, ROLES } from "../utils/constants";

const TEMPLATE_ICONS = {
  [ARTICLE_TYPES.HOW_TO]: BookMarked,
  [ARTICLE_TYPES.SOP]: ClipboardList,
  [ARTICLE_TYPES.FAQ]: HelpCircle,
  [ARTICLE_TYPES.TROUBLESHOOTING]: Wrench,
  [ARTICLE_TYPES.FEATURE_REF]: FileQuestion,
  [ARTICLE_TYPES.RELEASE_NOTES]: Rss,
};

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ArticleEditorPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(isEditMode ? 2 : 1);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Article fields (aligned with backend model)
  const [articleId, setArticleId] = useState(id ?? null);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState(""); // UI only – not sent to backend
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [content, setContent] = useState("");
  const [media, setMedia] = useState([]);
  const [status, setStatus] = useState("draft");

  // Load categories
  useEffect(() => {
    listCategories()
      .then((data) => setCategories(data.results ?? data ?? []))
      .catch(() => setCategories([]));
  }, []);

  // Load existing article in edit mode
  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    getArticle(id)
      .then((data) => {
        if (cancelled) return;
        const a = data;
        setArticleId(a.id);
        setSlug(a.slug ?? "");
        setTitle(a.title ?? "");
        setType(a.type ?? "");
        setCategoryId(a.category?.id ?? a.category ?? "");
        setTags(a.tags ?? []);
        setContent(a.content ?? "");
        setMedia(a.media ?? []);
        setStatus(a.status ?? "draft");
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id, isEditMode]);

  const selectTemplate = (t) => {
    setType(t);
    setStep(2);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };
  const removeTag = (t) => setTags(tags.filter((x) => x !== t));

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!isEditMode || !slug) {
      setSlug(generateSlug(newTitle));
    }
  };

  // ✅ Build payload – only fields that exist in the Article model
  const buildPayload = (nextStatus) => ({
    title,
    slug: slug || generateSlug(title),
    category: categoryId,       // backend expects integer ID
    tags,                       // list of tag names (or IDs, adjust if needed)
    content,
    status: nextStatus,
  });

  const validate = () => {
    if (!title.trim()) return "Please give the article a title.";
    if (!slug.trim()) return "Slug is required.";
    if (!categoryId) return "Please choose a category.";
    if (!content?.trim()) return "Article content is required.";
    return "";
  };

  const persist = async (nextStatus) => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload = buildPayload(nextStatus);
      console.log("Saving article with payload:", payload); // debug

      let savedArticle;
      if (articleId) {
        savedArticle = await updateArticle(articleId, payload);
      } else {
        savedArticle = await createArticle(payload);
        setArticleId(savedArticle.id ?? savedArticle.article?.id);
      }

      const finalId = articleId ?? savedArticle.id ?? savedArticle.article?.id;

      // Extra actions (submit for review, publish)
      if (nextStatus === "review") {
        await submitArticleForReview(finalId);
      } else if (nextStatus === "published" && user?.role === ROLES.ADMIN) {
        await publishArticle(finalId);
      }

      setStatus(nextStatus);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "Couldn't save the article. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file) => {
    const tempId = `temp_${Date.now()}`;
    setMedia((prev) => [
      ...prev,
      { id: tempId, name: file.name, type: file.type, size: file.size, uploading: true, progress: 0 },
    ]);

    let targetId = articleId;
    if (!targetId) {
      try {
        const created = await createArticle(buildPayload("draft"));
        targetId = created.id ?? created.article?.id;
        setArticleId(targetId);
      } catch (err) {
        setMedia((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, uploading: false, error: "Save the article first" } : m
          )
        );
        return;
      }
    }

    try {
      const result = await uploadArticleMedia(targetId, file, (evt) => {
        const progress = Math.round((evt.loaded / evt.total) * 100);
        setMedia((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, progress } : m))
        );
      });
      setMedia((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...result, uploading: false } : m
        )
      );
    } catch (err) {
      setMedia((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, uploading: false, error: err.message || "Upload failed" } : m
        )
      );
    }
  };

  const handleRemoveMedia = async (mediaId) => {
    setMedia((prev) => prev.filter((m) => m.id !== mediaId));
    if (articleId && !String(mediaId).startsWith("temp_")) {
      deleteArticleMedia(mediaId).catch(() => {});
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner label="Loading article…" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs mb-5 hover:underline"
        style={{ color: "#696E7A" }}
      >
        <ArrowLeft size={13} /> Back
      </button>

      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#121C2D" }}>
            {isEditMode ? "Edit article" : "New article"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#696E7A" }}>
            {step === 1
              ? "Choose a content template to get started."
              : "Fill in the article details below."}
          </p>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#00A368" }}>
            <CheckCircle2 size={15} /> Saved
          </span>
        )}
      </div>

      {/* Template selection */}
      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(ARTICLE_TYPE_LABELS).map(([key, label]) => {
            const Icon = TEMPLATE_ICONS[key];
            return (
              <button
                key={key}
                onClick={() => selectTemplate(key)}
                className="flex flex-col items-start text-left p-5 rounded-lg border hover:border-red-300 transition-colors"
                style={{ borderColor: "#E1E3EA" }}
              >
                <div
                  className="flex items-center justify-center rounded-lg mb-3"
                  style={{ width: 40, height: 40, background: "#FDEEF0" }}
                >
                  <Icon size={18} style={{ color: "#F22F46" }} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "#121C2D" }}>
                  {label}
                </p>
                <p className="text-xs" style={{ color: "#9EA6B3" }}>
                  {TEMPLATE_SECTIONS[key].join(" · ")}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Article editor */}
      {step === 2 && (
        <div className="space-y-6">
          <ErrorBanner message={error} />

          {/* Basic info */}
          <div className="bg-white rounded-lg border p-6 space-y-5" style={{ borderColor: "#E1E3EA" }}>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: "#FDEEF0", color: "#F22F46" }}
              >
                {ARTICLE_TYPE_LABELS[type] || "Article"}
              </span>
              {!isEditMode && (
                <button
                  onClick={() => setStep(1)}
                  className="text-xs hover:underline"
                  style={{ color: "#696E7A" }}
                >
                  Change template
                </button>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>
                Title <span style={{ color: "#F22F46" }}>*</span>
              </label>
              <input
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. How to reverse a discharge entry"
                className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none focus:border-red-500 transition-colors"
                style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>
                Slug <span style={{ color: "#F22F46" }}>*</span>
              </label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. how-to-reverse-discharge"
                className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none focus:border-red-500 transition-colors"
                style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
              />
              <p className="text-xs mt-1" style={{ color: "#9EA6B3" }}>
                The slug is used in the URL. It should be lowercase, hyphen-separated, and unique.
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>
                Category <span style={{ color: "#F22F46" }}>*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none focus:border-red-500 transition-colors"
                style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
              >
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c.id ?? c.slug} value={c.id ?? c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>
                Tags
              </label>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                    style={{ background: "#F4F4F6", color: "#243656" }}
                  >
                    {t}
                    <button onClick={() => removeTag(t)}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  className="flex-1 px-3.5 py-2 text-sm rounded-md border outline-none focus:border-red-500 transition-colors"
                  style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                />
                <button
                  onClick={addTag}
                  type="button"
                  className="flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium border transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#E1E3EA", color: "#243656" }}
                >
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Content - Rich Text Editor */}
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: "#E1E3EA" }}>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>
              Content <span style={{ color: "#F22F46" }}>*</span>
            </label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Write your article content here…"
            />
          </div>

          {/* Media uploader */}
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: "#E1E3EA" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#9EA6B3" }}>
              Media (optional) — screenshots, PDFs, or training videos
            </p>
            <MediaUploader
              items={media}
              onUpload={handleUpload}
              onRemove={handleRemoveMedia}
            />
          </div>

          {/* Action buttons */}
          <div
            className="flex items-center justify-between sticky bottom-0 bg-white/95 backdrop-blur-sm rounded-lg border p-4"
            style={{ borderColor: "#E1E3EA" }}
          >
            <span className="text-xs" style={{ color: "#9EA6B3" }}>
              Current status:{" "}
              <strong className="capitalize" style={{ color: "#243656" }}>
                {status}
              </strong>
            </span>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => persist("draft")}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:bg-gray-50 disabled:opacity-60"
                style={{ borderColor: "#E1E3EA", color: "#243656" }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save draft
              </button>
              <button
                onClick={() => persist("review")}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "#F22F46", color: "white" }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Submit for review
              </button>
              {user?.role === ROLES.ADMIN && (
                <button
                  onClick={() => persist("published")}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors disabled:opacity-60"
                  style={{ borderColor: "#00A368", color: "#00A368" }}
                >
                  <CheckCircle2 size={14} /> Publish
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}