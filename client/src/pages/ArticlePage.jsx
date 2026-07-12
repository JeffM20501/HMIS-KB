import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Clock, Eye, Star, Edit3, ChevronRight,
  ThumbsUp, ThumbsDown, CheckCircle2, LifeBuoy, Tag,
} from "lucide-react";
import { getArticle } from "../api/articles";
import { createFeedback } from "../api/analytics";
import StatusBadge from "../components/common/StatusBadge.jsx";
import Spinner from "../components/common/Spinner.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import RoleGate from "../components/common/RoleGate.jsx";
import useAuth from "../hooks/useAuth";
import { ARTICLE_TYPE_LABELS, ROLES } from "../utils/constants";

function StarRating({ value, onChange, readOnly, size = 20 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getArticle(slug)
      .then((data) => !cancelled && setArticle(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [slug]);

  const handleHelpful = async (helpful) => {
    setHelpfulVote(helpful);
    try {
      await createFeedback({ article: article.id, helpful });
    } catch {
      // non-blocking — the vote still shows locally even if the network call failed
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating) return;
    try {
      await createFeedback({ article: article.id, rating, comment });
      setFeedbackSent(true);
    } catch (err) {
      setError(err.message);
    }
  };

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

  const articleAuthorId = article.author?.id ?? article.author;
  const canEdit = user?.role === ROLES.ADMIN || (user?.role === ROLES.EDITOR && articleAuthorId === user?.id);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs mb-5" style={{ color: "#9EA6B3" }}>
        <button onClick={() => navigate("/app/knowledge-base")} className="flex items-center gap-1 hover:text-gray-700">
          <ArrowLeft size={12} /> Knowledge Base
        </button>
        {article.categoryName && (
          <>
            <ChevronRight size={12} />
            <span>{article.categoryName}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">
        {/* Main content */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#FDEEF0", color: "#F22F46" }}>
                {ARTICLE_TYPE_LABELS[article.type] ?? article.type}
              </span>
              <StatusBadge status={article.status} />
            </div>
            {canEdit && (
              <button
                onClick={() => navigate(`/app/articles/${article.id}/edit`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border flex-shrink-0 transition-colors hover:bg-gray-50"
                style={{ borderColor: "#E1E3EA", color: "#243656" }}
              >
                <Edit3 size={12} /> Edit article
              </button>
            )}
          </div>

          <h1 className="text-2xl lg:text-3xl font-semibold mb-4 leading-snug" style={{ color: "#121C2D" }}>
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs mb-6 pb-6 border-b" style={{ color: "#9EA6B3", borderColor: "#E8E8EC" }}>
            <span className="flex items-center gap-1.5"><Clock size={12} /> Updated {article.lastUpdated}</span>
            <span className="flex items-center gap-1.5"><Eye size={12} /> {(article.views ?? 0).toLocaleString()} views</span>
            {article.rating > 0 && (
              <span className="flex items-center gap-1.5">
                <Star size={12} style={{ color: "#F7C948" }} /> {article.rating.toFixed(1)} ({article.ratingCount} ratings)
              </span>
            )}
            {article.product_version && <span>Applies to v{article.product_version}</span>}
          </div>

          {/* Article body — sanitized HTML/markdown rendered by the backend */}
          <div className="article-body" dangerouslySetInnerHTML={{ __html: article.content ?? article.body ?? "" }} />

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

          {/* Was this helpful */}
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
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
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