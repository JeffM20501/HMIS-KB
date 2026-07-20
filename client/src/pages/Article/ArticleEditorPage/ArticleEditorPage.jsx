// src/pages/ArticleEditorPage/ArticleEditorPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Loader2, CheckCircle2, XCircle,
} from "lucide-react";
import { createArticle, updateArticle, getArticle, submitArticleForReview,
  publishArticle, uploadArticleMedia, deleteArticleMedia, } from "../../../api/articles.js";
import { listCategories } from "../../../api/categories";
import { listTags, createTag, bulkAddTags, bulkRemoveTags, listArticleTags } from "../../../api/categories";
import RichTextEditor from "../../../components/editor/RichTextEditor.jsx";
import MediaUploader from "../../../components/editor/MediaUploader.jsx";
import ErrorBanner from "../../../components/common/ErrorBanner.jsx";
import Spinner from "../../../components/common/Spinner.jsx";
import useAuth from "../../../hooks/useAuth";
import { ROLES } from "../../../utils/constants";
import TemplateSelector from "./components/TemplateSelector.jsx";
import EditorForm from "./components/EditForm.jsx";
import EditorActions from "./components/EditorActions.jsx";
import EditorModals from "./components/EditorModals.jsx";
import MediaModals from "./components/MediaModals.jsx";

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function ArticleEditorPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(isEditMode ? 2 : 1);
  const [categories, setCategories] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mediaMessage, setMediaMessage] = useState("");

  const [articleId, setArticleId] = useState(id ?? null);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [content, setContent] = useState("");
  const [media, setMedia] = useState([]);
  const [status, setStatus] = useState("draft");

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "",
    confirmColor: "#00A368",
    onConfirm: null,
  });
  const [resultModal, setResultModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const [mediaConfirmModal, setMediaConfirmModal] = useState({
    isOpen: false,
    mediaId: null,
    onConfirm: null,
  });

  // Media result modal
  const [mediaResultModal, setMediaResultModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });


  useEffect(() => {
    listCategories().then(data => setCategories(data.results ?? data ?? [])).catch(() => setCategories([]));
    listTags().then(data => setAllTags(data.results ?? data ?? [])).catch(() => setAllTags([]));
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    getArticle(id).then(data => {
      if (cancelled) return;
      const a = data;
      setArticleId(a.id);
      setSlug(a.slug ?? "");
      setTitle(a.title ?? "");
      setType(a.article_type ?? a.type ?? "");
      setCategoryId(a.category?.id ?? a.category ?? "");
      const tagList = a.tags ?? [];
      const tagNames = tagList.map(t => typeof t === 'string' ? t : t.name).filter(Boolean);
      setTags(tagNames);
      setContent(a.content ?? "");
      // Map media from API
      const mediaData = (a.media || []).map(m => ({
        id: m.id,
        name: m.filename,
        url: m.url,
        type: m.type,
        size: m.size || 0,
        uploaded: true,
      }));
      setMedia(mediaData);
      setStatus(a.status ?? "draft");
    }).catch(err => !cancelled && setError(err.message)).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id, isEditMode]);

  const selectTemplate = (t) => { setType(t); setStep(2); };
  const addTag = () => { const t = tagInput.trim(); if (t && !tags.includes(t)) setTags([...tags, t]); setTagInput(""); };
  const removeTag = (t) => setTags(tags.filter(x => x !== t));
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!isEditMode || !slug) setSlug(generateSlug(newTitle));
  };

  const resolveTagIds = async (tagNames) => {
    const ids = [];
    for (const name of tagNames) {
      let existing = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (!existing) {
        try {
          const newTag = await createTag({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') });
          existing = newTag;
          setAllTags(prev => [...prev, existing]);
        } catch (err) { continue; }
      }
      if (existing && existing.id) ids.push(existing.id);
    }
    return ids.filter(id => id !== null && id !== undefined);
  };

  const performSave = async (nextStatus) => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError(""); setSaving(true);
    try {
      const payload = {
        title,
        slug: slug || generateSlug(title),
        category: categoryId,
        content,
        status: nextStatus,
        article_type: type,
      };
      let response, finalSlug = slug;
      if (articleId) {
        response = await updateArticle(slug, payload);
      } else {
        response = await createArticle(payload);
        const newId = response.id ?? response.article?.id;
        const newSlug = response.slug ?? response.article?.slug;
        if (newId) setArticleId(newId);
        if (newSlug) { setSlug(newSlug); finalSlug = newSlug; } else finalSlug = slug;
      }
      const currentArticleId = articleId ?? response.id ?? response.article?.id;
      if (currentArticleId) {
        const tagIds = await resolveTagIds(tags);
        const validTagIds = tagIds.filter(id => id !== null && id !== undefined);
        if (validTagIds.length > 0) {
          if (isEditMode) {
            try {
              const existingTags = await listArticleTags(currentArticleId);
              const existingIds = (existingTags.results ?? existingTags ?? []).map(at => at.tag?.id).filter(id => id !== null && id !== undefined);
              const toRemove = existingIds.filter(id => !validTagIds.includes(id));
              if (toRemove.length > 0) await bulkRemoveTags(currentArticleId, toRemove);
            } catch (err) {}
          }
          await bulkAddTags(currentArticleId, validTagIds);
        }
      }
      if (nextStatus === "review") {
        await submitArticleForReview(finalSlug);
        openResultModal("success", "Submitted!", "Your article is now pending admin review.");
      } else if (nextStatus === "published" && user?.role === ROLES.ADMIN) {
        await publishArticle(finalSlug);
        openResultModal("success", "Published!", "The article is now visible to all users.");
      } else {
        openResultModal("success", "Saved!", "Your draft has been saved successfully.");
      }
      setStatus(nextStatus);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      openResultModal("error", "Operation Failed", msg || "Couldn't save the article. Please try again.");
    } finally { setSaving(false); }
  };

  const validate = () => {
    if (!title.trim()) return "Please give the article a title.";
    if (!slug.trim()) return "Slug is required.";
    if (!categoryId) return "Please choose a category.";
    if (!content?.trim()) return "Article content is required.";
    return "";
  };

  const openConfirmModal = (title, message, confirmLabel, onConfirm, confirmColor = "#00A368") => {
    setConfirmModal({ isOpen: true, title, message, confirmLabel, confirmColor, onConfirm });
  };
  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));
  const openResultModal = (type, title, message) => {
    setResultModal({ isOpen: true, type, title, message });
    setTimeout(() => closeResultModal(), 6000);
  };
  const closeResultModal = () => setResultModal(prev => ({ ...prev, isOpen: false }));

  const handleSaveDraft = () => performSave("draft");
  const handleSubmitForReview = () => {
    openConfirmModal("Submit for Review", "Submit this draft for admin review? Once submitted, you cannot edit it until it's reviewed.", "Submit", () => {
      closeConfirmModal();
      performSave("review");
    }, "#00A368");
  };
  const handlePublish = () => {
    openConfirmModal("Publish Article", "Are you sure you want to publish this article? It will become visible to all users.", "Publish", () => {
      closeConfirmModal();
      performSave("published");
    }, "#00A368");
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
        const payload = {
          title,
          slug: slug || generateSlug(title),
          category: categoryId,
          content,
          status: "draft",
          article_type: type,
        };
        const created = await createArticle(payload);
        targetId = created.id ?? created.article?.id;
        setArticleId(targetId);
        if (created.slug) setSlug(created.slug);
      } catch (err) {
        setMedia((prev) => prev.filter((m) => m.id !== tempId));
        setError("Please save the article draft before uploading media.");
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
          m.id === tempId ? { ...result, uploading: false, uploaded: true } : m
        )
      );
      setMediaMessage("✅ Media uploaded successfully");
      setTimeout(() => setMediaMessage(""), 3000);
    } catch (err) {
      setMedia((prev) => prev.filter((m) => m.id !== tempId));
      setError(err.message || "Upload failed");
    }
  };

  // Modal helpers for media
  const openMediaConfirmModal = (mediaId, onConfirm) => {
    setMediaConfirmModal({
      isOpen: true,
      mediaId,
      onConfirm,
    });
  };

  const closeMediaConfirmModal = () => {
    setMediaConfirmModal({ isOpen: false, mediaId: null, onConfirm: null });
  };

  const openMediaResultModal = (type, title, message) => {
    setMediaResultModal({ isOpen: true, type, title, message });
    setTimeout(() => closeMediaResultModal(), 5000);
  };

  const closeMediaResultModal = () => {
    setMediaResultModal({ isOpen: false, type: "success", title: "", message: "" });
  };

  // Updated handleRemoveMedia – now triggers confirmation modal
  const handleRemoveMedia = async (mediaId) => {
    const item = media.find(m => m.id === mediaId);
    if (!item) return;

    openMediaConfirmModal(mediaId, async () => {
      closeMediaConfirmModal();
      
      // Optimistically remove from UI
      setMedia((prev) => prev.filter((m) => m.id !== mediaId));

      if (articleId && !String(mediaId).startsWith("temp_")) {
        try {
          await deleteArticleMedia(mediaId);
          openMediaResultModal(
            "success",
            "Media Deleted",
            "The file was removed successfully."
          );
        } catch (err) {
          // Re-add the item if deletion fails
          setMedia((prev) => [...prev, { ...item, error: err.message || "Delete failed" }]);
          openMediaResultModal(
            "error",
            "Delete Failed",
            err.response?.data?.error || err.message || "Could not delete the media."
          );
        }
      } else {
        // Temporary item removed successfully
        openMediaResultModal(
          "success",
          "Media Removed",
          "The file was removed from the draft."
        );
      }
    });
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
            {step === 1 ? "Choose a content template to get started." : "Fill in the article details below."}
          </p>
        </div>
      </div>

      {step === 1 && <TemplateSelector onSelect={selectTemplate} />}

      {step === 2 && (
        <div className="space-y-6">
          <ErrorBanner message={error} />
          {mediaMessage && (
            <div
              className="p-3 rounded-lg text-sm border flex items-center gap-2"
              style={{ background: "#E6F7F1", borderColor: "#00A368", color: "#00A368" }}
            >
              <CheckCircle2 size={16} />
              {mediaMessage}
            </div>
          )}
          <EditorForm
            categories={categories}
            type={type}
            title={title}
            slug={slug}
            categoryId={categoryId}
            tags={tags}
            tagInput={tagInput}
            content={content}
            onTitleChange={handleTitleChange}
            onSlugChange={setSlug}
            onCategoryChange={setCategoryId}
            onAddTag={addTag}
            onRemoveTag={removeTag}
            onTagInputChange={setTagInput}
            onContentChange={setContent}
            isEditMode={isEditMode}
            onTemplateChange={() => setStep(1)}
          />
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: "#E1E3EA" }}>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>Content <span style={{ color: "#F22F46" }}>*</span></label>
            <RichTextEditor content={content} onChange={setContent} placeholder="Write your article content here…" />
          </div>
          <div className="bg-white rounded-lg border p-6" style={{ borderColor: "#E1E3EA" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#9EA6B3" }}>
              Media (optional) — screenshots, PDFs, or training videos
            </p>
            <MediaUploader items={media} onUpload={handleUpload} onRemove={handleRemoveMedia} />
          </div>
          <EditorActions
            status={status}
            saving={saving}
            onSaveDraft={handleSaveDraft}
            onSubmitForReview={handleSubmitForReview}
            onPublish={handlePublish}
            isAdmin={user?.role === ROLES.ADMIN}
          />
        </div>
      )}

      <EditorModals
        confirmModal={confirmModal}
        closeConfirmModal={closeConfirmModal}
        resultModal={resultModal}
        closeResultModal={closeResultModal}
      />

      <MediaModals
        confirmModal={mediaConfirmModal}
        closeConfirmModal={closeMediaConfirmModal}
        resultModal={mediaResultModal}
        closeResultModal={closeMediaResultModal}
      />
    </div>
  );
}