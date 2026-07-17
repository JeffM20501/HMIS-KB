import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Clock, Eye, Star, Edit3, ThumbsUp, ThumbsDown,
  CheckCircle2, LifeBuoy, Tag, User, Mail, Building2, Check,
  XCircle, Loader2, X,
} from "lucide-react";
import { getArticle, publishArticle, submitArticleForReview } from "../api/articles";
import { createFeedback, listFeedback, getMyFeedback } from "../api/analytics";
import { getRootCategories, listTags } from "../api/categories";
import StatusBadge from "../components/common/StatusBadge.jsx";
import Spinner from "../components/common/Spinner.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import RoleGate from "../components/common/RoleGate.jsx";
import useAuth from "../hooks/useAuth";
import { ARTICLE_TYPE_LABELS, ROLES } from "../utils/constants";

function StarRating({ value, onChange, readOnly, size = 18 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onChange?.(n)}
          className={readOnly ? "cursor-default" : "cursor-pointer"}
        >
          <Star
            size={size}
            style={{
              color: (hover || value) >= n ? "#F7C948" : "#E1E3EA",
              fill: (hover || value) >= n ? "#F7C948" : "none",
            }}
          />
        </button>
      ))}
    </div>
  );
}

export default function ArticlePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [helpfulVote, setHelpfulVote] = useState(null);

  const [categoryMap, setCategoryMap] = useState({});
  const [tagMap, setTagMap] = useState({});
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Rating stats
  const [ratingStats, setRatingStats] = useState({ average: 0, count: 0 });
  const [userAlreadyRated, setUserAlreadyRated] = useState(false);

  // Confirmation modal for publish / submit
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "",
    confirmColor: "#00A368",
    onConfirm: null,
  });

  // Confirmation modal for thumbs up/down
  const [helpfulConfirmModal, setHelpfulConfirmModal] = useState({
    isOpen: false,
    helpful: false,
    onConfirm: null,
  });

  // Result modal
  const [resultModal, setResultModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // Helper to fetch and compute rating stats
  const fetchArticleRating = async (articleId) => {
    try {
      const data = await listFeedback({
        content_type: 'article',
        object_id: articleId,
        page_size: 1000,
      });
      const feedbacks = data.results ?? data ?? [];
      const ratings = feedbacks.filter(f => typeof f.rating === 'number' && f.rating !== null);
      const count = ratings.length;
      const average = count > 0 ? ratings.reduce((sum, f) => sum + f.rating, 0) / count : 0;
      return { average, count };
    } catch {
      return {
        average: article?.rating ?? 0,
        count: article?.ratingCount ?? 0,
      };
    }
  };

  // Fetch article, categories, tags, and user's feedback for this article only
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    // Load article
    getArticle(slug)
      .then(async (data) => {
        if (cancelled) return;
        setArticle(data);

        if (data.status === 'published') {
          const stats = await fetchArticleRating(data.id);
          if (!cancelled) setRatingStats(stats);
        }

        if (user) {
          try {
            const feedbackData = await getMyFeedback({ page_size: 1000 });
            if (cancelled) return;
            const feedbacks = feedbackData.results ?? feedbackData ?? [];
            const hasRated = feedbacks.some(f =>
              f.content_type === 'article' &&
              f.object_id === data.id &&
              f.rating !== null &&
              f.rating !== undefined
            );
            if (hasRated) {
              setUserAlreadyRated(true);
              setFeedbackSent(true);
            }
          } catch (err) {
            const ratedKey = `rated_article_${slug}`;
            if (localStorage.getItem(ratedKey)) {
              setUserAlreadyRated(true);
              setFeedbackSent(true);
            }
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Load categories for mapping
    getRootCategories()
      .then((cats) => {
        if (cancelled) return;
        const map = {};
        cats.forEach((c) => { map[c.id] = c.name; });
        setCategoryMap(map);
        setCategoriesLoading(false);
      })
      .catch(() => {
        if (!cancelled) setCategoriesLoading(false);
      });

    // Load tags for mapping
    listTags()
      .then((tags) => {
        if (cancelled) return;
        const map = {};
        (tags.results ?? tags ?? []).forEach((t) => { map[t.id] = t.name; });
        setTagMap(map);
      })
      .catch(() => {
        // ignore tag loading errors – tags will fallback to IDs
      });

    return () => { cancelled = true; };
  }, [slug, user]);

  // ---- Helpful feedback with confirmation ----
  const handleHelpfulClick = (helpful) => {
    if (userAlreadyRated) return;
    setHelpfulConfirmModal({
      isOpen: true,
      helpful: helpful,
      onConfirm: async () => {
        setHelpfulConfirmModal({ isOpen: false, helpful: false, onConfirm: null });
        const ratingValue = helpful ? 5 : 1;
        try {
          await createFeedback({
            content_type: 'article',
            object_id: article.id,
            helpful: helpful,
            rating: ratingValue,
            comment: helpful ? "Thumbs up - helpful" : "Thumbs down - needs improvement",
          });
          setHelpfulVote(helpful);
          setUserAlreadyRated(true);
          setFeedbackSent(true);
          localStorage.setItem(`rated_article_${slug}`, 'true');
          const stats = await fetchArticleRating(article.id);
          setRatingStats(stats);
          openResultModal(
            "success",
            "Thank you!",
            `You rated this article ${ratingValue} star${ratingValue > 1 ? 's' : ''}.`
          );
        } catch (err) {
          openResultModal(
            "error",
            "Feedback Failed",
            err.message || "Could not submit your feedback. Please try again."
          );
        }
      }
    });
  };

  // ---- Rating feedback (star rating + comment) ----
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating) return;
    try {
      await createFeedback({
        content_type: 'article',
        object_id: article.id,
        rating,
        comment,
      });
      setFeedbackSent(true);
      setUserAlreadyRated(true);
      localStorage.setItem(`rated_article_${slug}`, 'true');
      const stats = await fetchArticleRating(article.id);
      setRatingStats(stats);
    } catch (err) {
      setError(err.message);
    }
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

  // ---- Action handlers ----
  const handlePublishClick = () => {
    openConfirmModal(
      "Publish Article",
      "Are you sure you want to publish this article? It will become visible to all users.",
      "Publish",
      async () => {
        closeConfirmModal();
        setPublishing(true);
        setPublishError("");
        try {
          await publishArticle(slug);
          const updated = await getArticle(slug);
          setArticle(updated);
          if (updated.status === 'published') {
            const stats = await fetchArticleRating(updated.id);
            setRatingStats(stats);
          }
          openResultModal("success", "Published!", "The article is now visible to all users.");
        } catch (err) {
          const msg = err.response?.data?.error || err.message || "Failed to publish article.";
          openResultModal("error", "Publish Failed", msg);
        } finally {
          setPublishing(false);
        }
      },
      "#00A368"
    );
  };

  const handleSubmitClick = () => {
    openConfirmModal(
      "Submit for Review",
      "Submit this draft for admin review? Once submitted, you cannot edit it until it's reviewed.",
      "Submit",
      async () => {
        closeConfirmModal();
        setSubmitting(true);
        setSubmitError("");
        try {
          await submitArticleForReview(slug);
          const updated = await getArticle(slug);
          setArticle(updated);
          openResultModal("success", "Submitted!", "Your article is now pending admin review.");
        } catch (err) {
          const msg = err.response?.data?.error || err.response?.data?.message || err.message;
          openResultModal("error", "Submission Failed", msg || "Failed to submit for review.");
        } finally {
          setSubmitting(false);
        }
      },
      "#00A368"
    );
  };

  // ---- Loading / Error ----
  if (loading) {
    return <div className="flex justify-center py-24"><Spinner label="Loading article…" /></div>;
  }

  if (error && !article) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <ErrorBanner message={error} />
        <button onClick={() => navigate(-1)} className="mt-4 text-sm font-medium hover:underline" style={{ color: "#F22F46" }}>
          &larr; Go back
        </button>
      </div>
    );
  }

  if (!article) return null;

  // ---- Data adaptations ----
  const authorName = article.author_username || "Unknown Author";
  const authorInitial = authorName.charAt(0).toUpperCase();
  const categoryName = categoryMap[article.category] || (article.category ? `Category ${article.category}` : "Uncategorized");
  const updatedDate = article.updated_at
    ? new Date(article.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "Recently";
  const createdDate = article.created_at
    ? new Date(article.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "—";
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "Draft";
  const approvedBy = article.publisher_username || "Not approved";

  const articleAuthorId = article.author;
  const canEdit = user?.role === ROLES.ADMIN || (user?.role === ROLES.EDITOR && articleAuthorId === user?.id);

  const showPublishButton = user?.role === ROLES.ADMIN && article.status === 'pending_review';
  const showSubmitButton = user?.role === ROLES.EDITOR && article.status === 'draft' && articleAuthorId === user?.id;

  const isPublished = article.status === 'published';
  const displayRating = isPublished ? ratingStats.average : 0;
  const displayRatingCount = isPublished ? ratingStats.count : 0;

  const renderRating = () => {
    if (!isPublished) return null;
    if (displayRatingCount === 0) {
      return (
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "#9EA6B3" }}>
          <Star size={12} style={{ color: "#E1E3EA", fill: "#E1E3EA" }} />
          No ratings yet
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5">
        <Star size={12} style={{ color: "#F7C948", fill: "#F7C948" }} />
        {displayRating.toFixed(1)} ({displayRatingCount} {displayRatingCount === 1 ? 'rating' : 'ratings'})
      </span>
    );
  };

  const showFeedbackForm = isPublished && !userAlreadyRated;

  // Helper to render tags
  const renderTags = () => {
    if (!article.tags?.length) return null;
    return (
      <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t" style={{ borderColor: "#E8E8EC" }}>
        <Tag size={13} style={{ color: "#9EA6B3" }} />
        {article.tags.map((tag) => {
          // If tag is already an object, extract name; if it's an ID, look up in tagMap
          let tagName;
          let tagKey;
          if (typeof tag === 'object') {
            tagName = tag.name;
            tagKey = tag.id;
          } else {
            tagKey = tag;
            tagName = tagMap[tag] || `Tag ${tag}`;
          }
          return (
            <span key={tagKey} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#F4F4F6", color: "#696E7A" }}>
              {tagName}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate("/app/knowledge-base")}
        className="flex items-center gap-1.5 text-xs hover:underline mb-6"
        style={{ color: "#696E7A" }}
      >
        <ArrowLeft size={13} /> Back to Knowledge Base
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        {/* Main content */}
        <div>
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span
              className="text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: "#FDEEF0", color: "#F22F46" }}
            >
              {categoryName}
            </span>
            <span
              className="text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: "#F4F4F6", color: "#696E7A" }}
            >
              {ARTICLE_TYPE_LABELS[article.type] || "Article"}
            </span>
            <StatusBadge status={article.status} />
            {canEdit && (
              <button
                onClick={() => navigate(`/app/articles/${article.slug}/edit`)}
                className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border hover:bg-gray-50 transition-colors"
                style={{ borderColor: "#E1E3EA", color: "#243656" }}
              >
                <Edit3 size={12} /> Edit
              </button>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl lg:text-3xl font-semibold mb-4 leading-snug" style={{ color: "#121C2D" }}>
            {article.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-xs mb-6 pb-6 border-b" style={{ color: "#696E7A", borderColor: "#E8E8EC" }}>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
                style={{ width: 28, height: 28, background: "#F22F46", color: "white" }}
              >
                {authorInitial}
              </div>
              <span style={{ color: "#121C2D" }}>{authorName}</span>
            </div>
            <span className="flex items-center gap-1.5">
              <Clock size={12} /> Updated {updatedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye size={12} /> {(article.views ?? 0).toLocaleString()} views
            </span>
            {renderRating()}
            {article.product_version && (
              <span className="flex items-center gap-1.5">Applies to v{article.product_version}</span>
            )}
          </div>

          {/* Warning */}
          <div
            className="mb-6 p-4 rounded-lg flex items-start gap-3"
            style={{ background: "#FEF9E7", border: "1px solid #F7C948" }}
          >
            <span style={{ fontSize: 18, lineHeight: 1.5 }}>📌</span>
            <p className="text-sm leading-relaxed" style={{ color: "#C9A000" }}>
              <strong>Always verify procedures against the current HMIS version.</strong>{" "}
              Last updated: <strong>{updatedDate}</strong> for HMIS v{article.product_version || "2.x"}.
            </p>
          </div>

          {/* Content */}
          <div className="article-body" dangerouslySetInnerHTML={{ __html: article.content ?? article.body ?? "" }} />

          {/* Tags - using renderTags helper */}
          {renderTags()}

          {/* Feedback section (unchanged) */}
          {isPublished ? (
            <div className="mt-8 p-5 rounded-lg" style={{ background: "#F9FAFB", border: "1px solid #E8E8EC" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium" style={{ color: "#121C2D" }}>Was this article helpful?</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleHelpfulClick(true)}
                      disabled={userAlreadyRated}
                      className="p-2 rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        borderColor: helpfulVote === true ? "#00A368" : "#E1E3EA",
                        background: helpfulVote === true ? "#E6F7F1" : "white",
                        color: helpfulVote === true ? "#00A368" : "#696E7A",
                      }}
                    >
                      <ThumbsUp size={15} />
                    </button>
                    <span className="text-xs" style={{ color: "#9EA6B3" }}>This was helpful</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleHelpfulClick(false)}
                      disabled={userAlreadyRated}
                      className="p-2 rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        borderColor: helpfulVote === false ? "#F22F46" : "#E1E3EA",
                        background: helpfulVote === false ? "#FDEEF0" : "white",
                        color: helpfulVote === false ? "#F22F46" : "#696E7A",
                      }}
                    >
                      <ThumbsDown size={15} />
                    </button>
                    <span className="text-xs" style={{ color: "#9EA6B3" }}>This needs improvement</span>
                  </div>
                </div>
              </div>

              {feedbackSent ? (
                <div className="flex items-center gap-2 text-sm mt-4" style={{ color: "#00A368" }}>
                  <CheckCircle2 size={15} /> 
                  {userAlreadyRated ? "You've already rated this article. Thank you!" : "Thanks — your feedback helps us keep this article accurate."}
                </div>
              ) : (
                showFeedbackForm ? (
                  <form onSubmit={handleSubmitReview} className="space-y-3 mt-4">
                    <StarRating value={rating} onChange={setRating} />
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Optional: tell us what could be improved…"
                      rows={2}
                      className="w-full px-3 py-2 text-sm rounded-md border outline-none resize-none"
                      style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
                    />
                    <button
                      type="submit"
                      disabled={!rating}
                      className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-40 transition-opacity"
                      style={{ background: "#F22F46", color: "white" }}
                    >
                      Submit feedback
                    </button>
                  </form>
                ) : (
                  <div className="text-sm text-center mt-4" style={{ color: "#696E7A" }}>
                    <CheckCircle2 size={15} className="inline mr-1" /> You've already shared your rating. Thank you!
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="mt-8 p-5 rounded-lg text-center" style={{ background: "#F9FAFB", border: "1px solid #E8E8EC" }}>
              <LifeBuoy size={16} className="inline mr-2" style={{ color: "#696E7A" }} />
              <span className="text-sm" style={{ color: "#696E7A" }}>
                Feedback is only available for published articles. Please check back once this article is published.
              </span>
            </div>
          )}
        </div>

        {/* Sidebar – unchanged */}
        <aside className="space-y-5">
          {/* Article Meta Card */}
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#E1E3EA" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#9EA6B3" }}>
              Article Information
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "#696E7A" }}>Author</span>
                <span style={{ color: "#121C2D" }}>{authorName}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#696E7A" }}>Category</span>
                <span style={{ color: "#121C2D" }}>{categoryName}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#696E7A" }}>Created</span>
                <span style={{ color: "#121C2D" }}>{createdDate}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#696E7A" }}>Published</span>
                <span style={{ color: "#121C2D" }}>{publishedDate}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#696E7A" }}>Approved by</span>
                <span style={{ color: "#121C2D" }}>{approvedBy}</span>
              </div>
              {isPublished && (
                <div className="flex justify-between">
                  <span style={{ color: "#696E7A" }}>Rating</span>
                  <span style={{ color: "#121C2D" }} className="flex items-center gap-1">
                    {displayRatingCount === 0 ? (
                      <>
                        <Star size={12} style={{ color: "#E1E3EA", fill: "#E1E3EA" }} />
                        No ratings
                      </>
                    ) : (
                      <>
                        <Star size={12} style={{ color: "#F7C948", fill: "#F7C948" }} />
                        {displayRating.toFixed(1)} ({displayRatingCount})
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Editor Actions: Submit for Review */}
          {showSubmitButton && (
            <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#E1E3EA" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#9EA6B3" }}>
                Editor Actions
              </p>
              <button
                onClick={handleSubmitClick}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
                style={{ background: "#00A368" }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    <Check size={16} /> Submit for Review
                  </>
                )}
              </button>
              <p className="text-xs mt-2" style={{ color: "#696E7A" }}>
                Once submitted, an admin will review and publish it.
              </p>
            </div>
          )}

          {/* Admin Actions: Publish */}
          {showPublishButton && (
            <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#E1E3EA" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#9EA6B3" }}>
                Admin Actions
              </p>
              <button
                onClick={handlePublishClick}
                disabled={publishing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
                style={{ background: "#00A368" }}
              >
                {publishing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Publishing…
                  </>
                ) : (
                  <>
                    <Check size={16} /> Publish / Approve
                  </>
                )}
              </button>
              <p className="text-xs mt-2" style={{ color: "#696E7A" }}>
                This will make the article visible to all users.
              </p>
            </div>
          )}

          {/* Table of Contents */}
          {article.toc?.length > 0 && (
            <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#E1E3EA" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#9EA6B3" }}>On this page</p>
              <nav className="space-y-1.5">
                {article.toc.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="block text-xs hover:underline" style={{ color: "#455A77" }}>
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          )}

          {/* Related Articles */}
          {article.relatedArticles?.length > 0 && (
            <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#E1E3EA" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#9EA6B3" }}>Related articles</p>
              <div className="space-y-3">
                {article.relatedArticles.map((rel) => (
                  <button
                    key={rel.id}
                    onClick={() => navigate(`/app/knowledge-base/${rel.slug ?? rel.id}`)}
                    className="block text-left text-xs font-medium hover:underline"
                    style={{ color: "#0263E0" }}
                  >
                    {rel.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Support button */}
          <RoleGate allow={[ROLES.VIEWER, ROLES.EDITOR, ROLES.ADMIN]}>
            <button
              onClick={() => alert("This would open a support ticket referencing this article.")}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-md text-sm font-medium border transition-colors hover:bg-gray-50"
              style={{ borderColor: "#E1E3EA", color: "#243656" }}
            >
              <LifeBuoy size={14} /> Still need help?
            </button>
          </RoleGate>
        </aside>
      </div>

      {/* ---- Modals – unchanged ---- */}
      {confirmModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={closeConfirmModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: "#121C2D" }}>
              {confirmModal.title}
            </h3>
            <p className="text-sm mb-6" style={{ color: "#696E7A" }}>
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:bg-gray-50"
                style={{ borderColor: "#E1E3EA", color: "#696E7A" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors hover:opacity-90"
                style={{ background: confirmModal.confirmColor }}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {helpfulConfirmModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setHelpfulConfirmModal({ isOpen: false, helpful: false, onConfirm: null })}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: "#121C2D" }}>
              {helpfulConfirmModal.helpful ? "Mark as Helpful" : "Mark as Needs Improvement"}
            </h3>
            <p className="text-sm mb-6" style={{ color: "#696E7A" }}>
              {helpfulConfirmModal.helpful
                ? "This will give the article a 5-star rating. You won't be able to change it later. Continue?"
                : "This will give the article a 1-star rating. You won't be able to change it later. Continue?"}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setHelpfulConfirmModal({ isOpen: false, helpful: false, onConfirm: null })}
                className="px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:bg-gray-50"
                style={{ borderColor: "#E1E3EA", color: "#696E7A" }}
              >
                Cancel
              </button>
              <button
                onClick={helpfulConfirmModal.onConfirm}
                className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors hover:opacity-90"
                style={{ background: helpfulConfirmModal.helpful ? "#00A368" : "#F22F46" }}
              >
                {helpfulConfirmModal.helpful ? "Yes, it was helpful" : "Yes, needs improvement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {resultModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={closeResultModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {resultModal.type === "success" ? (
              <CheckCircle2 size={48} style={{ color: "#00A368" }} className="mx-auto mb-3" />
            ) : (
              <XCircle size={48} style={{ color: "#F22F46" }} className="mx-auto mb-3" />
            )}
            <h3 className="text-lg font-semibold mb-2" style={{ color: "#121C2D" }}>
              {resultModal.title}
            </h3>
            <p className="text-sm mb-6" style={{ color: "#696E7A" }}>
              {resultModal.message}
            </p>
            <div className="flex justify-center gap-3">
              {resultModal.type === "success" && (
                <button
                  onClick={() => {
                    closeResultModal();
                    navigate("/app/knowledge-base");
                  }}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors hover:opacity-90"
                  style={{ background: "#00A368" }}
                >
                  Back to Knowledge Base
                </button>
              )}
              <button
                onClick={closeResultModal}
                className="px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:bg-gray-50"
                style={{ borderColor: "#E1E3EA", color: "#696E7A" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}