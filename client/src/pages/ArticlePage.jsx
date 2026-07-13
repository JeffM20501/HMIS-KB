import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Clock, Eye, Star, Edit3, ThumbsUp, ThumbsDown,
  CheckCircle2, LifeBuoy, Tag, User, Mail, Building2, Check,
  XCircle, Loader2,
} from "lucide-react";
import { getArticle, publishArticle, submitArticleForReview } from "../api/articles";
import { createFeedback } from "../api/analytics";
import { getRootCategories } from "../api/categories";
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
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false); // new

  // Fetch article and categories
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getArticle(slug)
      .then((data) => {
        if (!cancelled) setArticle(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    getRootCategories()
      .then((cats) => {
        if (!cancelled) {
          const map = {};
          cats.forEach((c) => { map[c.id] = c.name; });
          setCategoryMap(map);
          setCategoriesLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCategoriesLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  // Helpful feedback
  const handleHelpful = async (helpful) => {
    setHelpfulVote(helpful);
    try {
      await createFeedback({
        content_type: 'article',
        object_id: article.id,
        helpful,
      });
    } catch (err) {
      // ignore
    }
  };

  // Rating feedback
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
    } catch (err) {
      setError(err.message);
    }
  };

  // Publish (admin)
  const handlePublish = async () => {
    if (!window.confirm("Are you sure you want to publish this article? It will become visible to all users.")) {
      return;
    }
    setPublishing(true);
    setPublishError("");
    try {
      await publishArticle(slug);
      const updated = await getArticle(slug);
      setArticle(updated);
    } catch (err) {
      setPublishError(err.response?.data?.error || err.message || "Failed to publish article.");
    } finally {
      setPublishing(false);
    }
  };

  // Submit for review (editor)
  const handleSubmitForReview = async () => {
    if (!window.confirm("Submit this draft for admin review? Once submitted, you cannot edit it until it's reviewed.")) {
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);
    try {
      await submitArticleForReview(slug);
      // Refetch to get updated status
      const updated = await getArticle(slug);
      setArticle(updated);
      setSubmitSuccess(true);
      // Auto-hide success after 4 seconds
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      // Extract meaningful error message
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      setSubmitError(msg || "Failed to submit for review. Please check server logs.");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading & error states
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
                onClick={() => navigate(`/app/articles/${article.id}/edit`)}
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
            {article.rating > 0 && (
              <span className="flex items-center gap-1.5">
                <Star size={12} style={{ color: "#F7C948", fill: "#F7C948" }} />
                {article.rating.toFixed(1)} ({article.ratingCount} ratings)
              </span>
            )}
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

          {/* Tags */}
          {article.tags?.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t" style={{ borderColor: "#E8E8EC" }}>
              <Tag size={13} style={{ color: "#9EA6B3" }} />
              {article.tags.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#F4F4F6", color: "#696E7A" }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Feedback section */}
          {isPublished ? (
            <div className="mt-8 p-5 rounded-lg" style={{ background: "#F9FAFB", border: "1px solid #E8E8EC" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium" style={{ color: "#121C2D" }}>Was this article helpful?</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleHelpful(true)}
                    className="p-2 rounded-md border transition-colors"
                    style={{
                      borderColor: helpfulVote === true ? "#00A368" : "#E1E3EA",
                      background: helpfulVote === true ? "#E6F7F1" : "white",
                      color: helpfulVote === true ? "#00A368" : "#696E7A",
                    }}
                  >
                    <ThumbsUp size={15} />
                  </button>
                  <button
                    onClick={() => handleHelpful(false)}
                    className="p-2 rounded-md border transition-colors"
                    style={{
                      borderColor: helpfulVote === false ? "#F22F46" : "#E1E3EA",
                      background: helpfulVote === false ? "#FDEEF0" : "white",
                      color: helpfulVote === false ? "#F22F46" : "#696E7A",
                    }}
                  >
                    <ThumbsDown size={15} />
                  </button>
                </div>
              </div>

              {feedbackSent ? (
                <div className="flex items-center gap-2 text-sm" style={{ color: "#00A368" }}>
                  <CheckCircle2 size={15} /> Thanks — your feedback helps us keep this article accurate.
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-3">
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

        {/* Sidebar */}
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
            </div>
          </div>

          {/* Editor Actions: Submit for Review */}
          {showSubmitButton && (
            <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#E1E3EA" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#9EA6B3" }}>
                Editor Actions
              </p>
              {submitError && (
                <div className="mb-2 text-xs text-red-600 flex items-center gap-1">
                  <XCircle size={14} /> {submitError}
                </div>
              )}
              {submitSuccess && (
                <div className="mb-2 text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Submitted successfully! Waiting for admin review.
                </div>
              )}
              <button
                onClick={handleSubmitForReview}
                disabled={submitting || submitSuccess}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
                style={{ background: "#E87722" }}
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
              {publishError && (
                <div className="mb-2 text-xs text-red-600 flex items-center gap-1">
                  <XCircle size={14} /> {publishError}
                </div>
              )}
              <button
                onClick={handlePublish}
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

          {/* Table of Contents & Related – unchanged */}
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
    </div>
  );
}