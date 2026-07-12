import { useEffect, useMemo, useState } from "react";
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
import MediaUploader from "../components/editor/MediaUploader.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import Spinner from "../components/common/Spinner.jsx";
import useAuth from "../hooks/useAuth";
import {
  ARTICLE_TYPES, ARTICLE_TYPE_LABELS, TEMPLATE_SECTIONS, ROLES,
} from "../utils/constants";

const TEMPLATE_ICONS = {
  [ARTICLE_TYPES.HOW_TO]: BookMarked,
  [ARTICLE_TYPES.SOP]: ClipboardList,
  [ARTICLE_TYPES.FAQ]: HelpCircle,
  [ARTICLE_TYPES.TROUBLESHOOTING]: Wrench,
  [ARTICLE_TYPES.FEATURE_REF]: FileQuestion,
  [ARTICLE_TYPES.RELEASE_NOTES]: Rss,
};

function emptySections(type) {
  const sections = TEMPLATE_SECTIONS[type] ?? [];
  return Object.fromEntries(sections.map((s) => [s, ""]));
}

export default function ArticleEditorPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(isEditMode ? 2 : 1); // 1 = choose template, 2 = fill in content
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [articleId, setArticleId] = useState(id ?? null);
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productVersion, setProductVersion] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [sections, setSections] = useState({});
  const [media, setMedia] = useState([]);
  const [status, setStatus] = useState("draft");

  useEffect(() => {
    listCategories().then((data) => setCategories(data.results ?? data ?? [])).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    getArticle(id)
      .then((data) => {
        if (cancelled) return;
        const a = data; // DRF retrieve() returns the object directly
        setArticleId(a.id);
        setType(a.type);
        setTitle(a.title ?? "");
        setCategoryId(a.category?.id ?? a.category ?? "");
        setProductVersion(a.product_version ?? "");
        setTags(a.tags ?? []);
        setSections(a.sections ?? emptySections(a.type));
        setMedia(a.media ?? []);
        setStatus(a.status ?? "draft");
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id, isEditMode]);

  const requiredSections = useMemo(() => TEMPLATE_SECTIONS[type] ?? [], [type]);

  const selectTemplate = (t) => {
    setType(t);
    setSections(emptySections(t));
    setStep(2);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (t) => setTags(tags.filter((x) => x !== t));

  // ASSUMPTION: ArticleSerializer accepts `category` (FK id), `product_version`,
  // `tags` (list of tag names/ids — if it doesn't accept nested writes because
  // of the separate ArticleTagViewSet through-table, swap this for a create,
  // then N calls to attachTagToArticle() from api/categories.js), and a
  // `sections` JSONField. Rename any of these to match your ArticleSerializer.
  const buildPayload = (nextStatus) => ({
    title,
    type,
    category: categoryId,
    product_version: productVersion,
    tags,
    sections,
    // Concatenate sections into renderable HTML/content for the article body.
    content: requiredSections
      .map((s) => (sections[s]?.trim() ? `<h2>${s}</h2><p>${sections[s].replace(/\n/g, "<br/>")}</p>` : ""))
      .join(""),
    status: nextStatus,
  });

  const validate = () => {
    if (!title.trim()) return "Give the article a title.";
    if (!categoryId) return "Choose a category.";
    const missing = requiredSections.filter((s) => !sections[s]?.trim());
    if (missing.length) return `Please fill in: ${missing.join(", ")}.`;
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
      let saved;
      if (articleId) {
        saved = await updateArticle(articleId, payload);
      } else {
        saved = await createArticle(payload);
        setArticleId(saved.id ?? saved.article?.id);
      }

      const finalId = articleId ?? saved.id ?? saved.article?.id;

      if (nextStatus === "review") {
        await submitArticleForReview(finalId);
      } else if (nextStatus === "published" && user?.role === ROLES.ADMIN) {
        await publishArticle(finalId);
      }

      setStatus(nextStatus);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || "Couldn't save the article. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file) => {
    const tempId = `temp_${Date.now()}`;
    setMedia((prev) => [...prev, { id: tempId, name: file.name, type: file.type, size: file.size, uploading: true, progress: 0 }]);

    // If the article hasn't been saved yet, save a draft first so media has somewhere to attach.
    let targetId = articleId;
    if (!targetId) {
      try {
        const created = await createArticle(buildPayload("draft"));
        targetId = created.id ?? created.article?.id;
        setArticleId(targetId);
      } catch (err) {
        setMedia((prev) => prev.map((m) => (m.id === tempId ? { ...m, uploading: false, error: "Save the article first" } : m)));
        return;
      }
    }

    try {
      const result = await uploadArticleMedia(targetId, file, (evt) => {
        const progress = Math.round((evt.loaded / evt.total) * 100);
        setMedia((prev) => prev.map((m) => (m.id === tempId ? { ...m, progress } : m)));
      });
      setMedia((prev) => prev.map((m) => (m.id === tempId ? { ...result, uploading: false } : m)));
    } catch (err) {
      setMedia((prev) => prev.map((m) => (m.id === tempId ? { ...m, uploading: false, error: err.message || "Upload failed" } : m)));
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
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs mb-5 hover:underline" style={{ color: "#696E7A" }}>
        <ArrowLeft size={13} /> Back
      </button>

      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#121C2D" }}>
            {isEditMode ? "Edit article" : "New article"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#696E7A" }}>
            {step === 1 ? "Choose a content template to get started." : "All articles must follow one of the six standardized templates."}
          </p>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#00A368" }}>
            <CheckCircle2 size={15} /> Saved
          </span>
        )}
      </div>

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
                <div className="flex items-center justify-center rounded-lg mb-3" style={{ width: 40, height: 40, background: "#FDEEF0" }}>
                  <Icon size={18} style={{ color: "#F22F46" }} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "#121C2D" }}>{label}</p>
                <p className="text-xs" style={{ color: "#9EA6B3" }}>
                  {TEMPLATE_SECTIONS[key].join(" · ")}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <ErrorBanner message={error} />

          <div className="bg-white rounded-lg border p-6 space-y-5" style={{ borderColor: "#E1E3EA" }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "#FDEEF0", color: "#F22F46" }}>
                {ARTICLE_TYPE_LABELS[type]}
              </span>
              {!isEditMode && (
                <button onClick={() => setStep(1)} className="text-xs hover:underline" style={{ color: "#696E7A" }}>
                  Change template
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How to reverse a discharge entry"
                className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none"
                style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none"
                  style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                >
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id ?? c.slug} value={c.id ?? c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Applies to product version</label>
                <input
                  value={productVersion}
                  onChange={(e) => setProductVersion(e.target.value)}
                  placeholder="e.g. 4.2.0"
                  className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none"
                  style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Tags</label>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ background: "#F4F4F6", color: "#243656" }}>
                    {t}
                    <button onClick={() => removeTag(t)}><X size={11} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Add a tag and press Enter"
                  className="flex-1 px-3.5 py-2 text-sm rounded-md border outline-none"
                  style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                />
                <button onClick={addTag} type="button" className="flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium border" style={{ borderColor: "#E1E3EA", color: "#243656" }}>
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>
          </div>

          
          <div className="bg-white rounded-lg border p-6 space-y-5" style={{ borderColor: "#E1E3EA" }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#9EA6B3" }}>
              Required sections for {ARTICLE_TYPE_LABELS[type]}
            </p>
            {requiredSections.map((section) => (
              <div key={section}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>{section}</label>
                <textarea
                  value={sections[section] ?? ""}
                  onChange={(e) => setSections((prev) => ({ ...prev, [section]: e.target.value }))}
                  rows={section === "Steps" || section === "Procedure Steps" ? 6 : 3}
                  placeholder={`Write the ${section.toLowerCase()} here…`}
                  className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none resize-y"
                  style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                />
              </div>
            ))}
          </div>

          
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: "#E1E3EA" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#9EA6B3" }}>
              Media (optional) — screenshots, PDFs, or training videos
            </p>
            <MediaUploader items={media} onUpload={handleUpload} onRemove={handleRemoveMedia} />
          </div>

          
          <div className="flex items-center justify-between sticky bottom-0 bg-white/95 backdrop-blur-sm rounded-lg border p-4" style={{ borderColor: "#E1E3EA" }}>
            <span className="text-xs" style={{ color: "#9EA6B3" }}>
              Current status: <strong className="capitalize" style={{ color: "#243656" }}>{status}</strong>
            </span>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => persist("draft")}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:bg-gray-50 disabled:opacity-60"
                style={{ borderColor: "#E1E3EA", color: "#243656" }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save draft
              </button>
              <button
                onClick={() => persist("review")}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "#F22F46", color: "white" }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Submit for review
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
