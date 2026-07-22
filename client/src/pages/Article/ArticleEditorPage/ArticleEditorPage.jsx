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
import Toast from "../../../components/common/Toast.jsx";
import useAuth from "../../../hooks/useAuth";
import { ROLES } from "../../../utils/constants";
import TemplateSelector from "./components/TemplateSelector.jsx";
import EditorForm from "./components/EditForm.jsx";
import EditorActions from "./components/EditorActions.jsx";
import EditorModals from "./components/EditorModals.jsx";
import MediaDeleteModal from "./components/MediaDeleteModal.jsx";

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
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

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");

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

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    mediaId: null,
    mediaName: "",
    isStaged: false,
    onConfirm: null,
  });

  const showToast = (message, type = "info") => {
    setToastMessage(message);
    setToastType(type);
  };

  // Load categories and tags
  useEffect(() => {
    listCategories().then(data => setCategories(data.results ?? data ?? [])).catch(() => setCategories([]));
    listTags().then(data => setAllTags(data.results ?? data ?? [])).catch(() => setAllTags([]));
  }, []);

  // Load existing article
  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    getArticle(id).then(data => {
      if (cancelled) return;
      const a = data;
      setArticleId(a.id);
      const loadedSlug = (a.slug ?? "").slice(0, 200);
      setSlug(loadedSlug);
      setTitle(a.title ?? "");
      setType(a.article_type ?? a.type ?? "");
      setCategoryId(a.category?.id ?? a.category ?? "");
      const tagList = a.tags ?? [];
      const tagNames = tagList.map(t => typeof t === 'string' ? t : t.name).filter(Boolean);
      setTags(tagNames);
      setContent(a.content ?? "");
      const existingMedia = (a.media || []).map(m => ({
        ...m,
        staged: false,
        uploading: false,
        uploaded: true,
      }));
      setMedia(existingMedia);
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
    const generated = generateSlug(newTitle);
    setSlug(generated);
  };

  // ---- Media staging ----
  const handleStageFile = (file) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const reader = new FileReader();
    
    setMedia(prev => [
      ...prev,
      {
        id: tempId,
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        staged: true,
        uploading: false,
        uploaded: false,
        preview: null,
        progress: 0,
        error: null,
      }
    ]);
    
    if (file.type.startsWith('image/')) {
      reader.onload = (e) => {
        const preview = e.target.result;
        setMedia(prev => prev.map(m => 
          m.id === tempId ? { ...m, preview } : m
        ));
      };
      reader.readAsDataURL(file);
    }
    
    showToast("File staged – will be uploaded on save.", "info");
  };

  // ---- Media deletion ----
  const handleRemoveMedia = (mediaId) => {
    const item = media.find(m => m.id === mediaId);
    if (!item) return;

    setDeleteModal({
      isOpen: true,
      mediaId: item.id,
      mediaName: item.name,
      isStaged: item.staged,
      onConfirm: async () => {
        setDeleteModal({ ...deleteModal, isOpen: false });

        if (item.staged) {
          setMedia(prev => prev.filter(m => m.id !== mediaId));
          showToast("File removed from draft.", "success");
        } else {
          try {
            await deleteArticleMedia(mediaId);
            setMedia(prev => prev.filter(m => m.id !== mediaId));
            showToast("Media removed successfully.", "success");
          } catch (err) {
            showToast(err.message || "Failed to delete media.", "error");
          }
        }
      },
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ ...deleteModal, isOpen: false });
  };

  // ---- Resolve tag IDs ----
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

  // ---- Perform save ----
  const performSave = async (nextStatus) => {
    const validationError = validate();
    if (validationError) { 
      setError(validationError); 
      showToast(validationError, "error");
      return; 
    }
    setError("");
    setSaving(true);

    try {
      //  Always save as draft first; the action will change status if needed
      const payload = {
        title,
        slug: slug || generateSlug(title),
        category: categoryId,
        content,
        status: "draft", // always draft on save
        article_type: type,
      };
      let response, newSlug = slug;
      if (articleId) {
        response = await updateArticle(slug, payload);
      } else {
        response = await createArticle(payload);
        const newId = response.id ?? response.article?.id;
        const newSlugVal = response.slug ?? response.article?.slug;
        if (newId) setArticleId(newId);
        if (newSlugVal) { setSlug(newSlugVal); newSlug = newSlugVal; }
      }
      const currentArticleId = articleId ?? response.id ?? response.article?.id;

      // Upload staged media
      const stagedItems = media.filter(m => m.staged);
      let uploadErrors = [];
      if (stagedItems.length > 0 && currentArticleId) {
        for (const item of stagedItems) {
          try {
            const result = await uploadArticleMedia(currentArticleId, item.file, (evt) => {
              const progress = Math.round((evt.loaded / evt.total) * 100);
              setMedia(prev => prev.map(m => m.id === item.id ? { ...m, progress } : m));
            });
            setMedia(prev => prev.map(m => 
              m.id === item.id ? { ...result, staged: false, uploading: false, uploaded: true, file: undefined, preview: undefined } : m
            ));
          } catch (err) {
            uploadErrors.push({ name: item.name, error: err.message });
            setMedia(prev => prev.map(m => 
              m.id === item.id ? { ...m, staged: false, uploading: false, error: err.message } : m
            ));
          }
        }
        if (uploadErrors.length > 0) {
          showToast(`Upload failed for: ${uploadErrors.map(e => e.name).join(', ')}`, "error");
        } else {
          showToast("All media uploaded successfully.", "success");
        }
      }

      // Manage tags
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

      //  Now perform the extra action (review or publish)
      if (nextStatus === "review") {
        await submitArticleForReview(newSlug);
        openResultModal("success", "Submitted!", "Your article is now pending admin review.");
      } else if (nextStatus === "published" && user?.role === ROLES.ADMIN) {
        await publishArticle(newSlug);
        openResultModal("success", "Published!", "The article is now visible to all users.");
      } else {
        // draft saved
        openResultModal("success", "Saved!", "Your draft has been saved successfully.");
      }
      // Update local status for the bottom bar
      if (nextStatus === "review") setStatus("pending_review");
      else if (nextStatus === "published") setStatus("published");
      else setStatus("draft");
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      showToast(msg || "Couldn't save the article. Please try again.", "error");
      openResultModal("error", "Operation Failed", msg || "Couldn't save the article. Please try again.");
    } finally { setSaving(false); }
  };

  const validate = () => {
    if (!title.trim()) return "Please give the article a title.";
    if (!slug.trim()) return "Slug is required.";
    if (slug.length > 200) return "Slug must be 200 characters or less.";
    if (!categoryId) return "Please choose a category.";
    if (!content?.trim()) return "Article content is required.";
    return "";
  };

  // ---- Modals ----
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

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage("")}
        />
      )}

      {step === 1 && <TemplateSelector onSelect={selectTemplate} />}

      {step === 2 && (
        <div className="space-y-6">
          <ErrorBanner message={error} />
          <EditorForm
            categories={categories}
            type={type}
            title={title}
            slug={slug}
            categoryId={categoryId}
            tags={tags}
            tagInput={tagInput}
            onTitleChange={handleTitleChange}
            onCategoryChange={setCategoryId}
            onAddTag={addTag}
            onRemoveTag={removeTag}
            onTagInputChange={setTagInput}
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
            <MediaUploader items={media} onUpload={handleStageFile} onRemove={handleRemoveMedia} showStaged={true} />
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

      <MediaDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={deleteModal.onConfirm}
        mediaName={deleteModal.mediaName}
        isStaged={deleteModal.isStaged}
      />

      <EditorModals
        confirmModal={confirmModal}
        closeConfirmModal={closeConfirmModal}
        resultModal={resultModal}
        closeResultModal={closeResultModal}
      />
    </div>
  );
}