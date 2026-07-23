import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  getArticle, 
  publishArticle, 
  submitArticleForReview,
  deleteArticle,
} from "../../../api/articles.js";
import { createFeedback, listFeedback, getMyFeedback, getFeedbackStats } from "../../../api/analytics";
import { getRootCategories, listTags } from "../../../api/categories";
import { useLookupMaps } from "../../../hooks/useLookupMaps";
import Spinner from "../../../components/common/Spinner.jsx";
import ErrorBanner from "../../../components/common/ErrorBanner.jsx";
import useAuth from "../../../hooks/useAuth";
import { ROLES } from "../../../utils/constants";
import ArticleHeader from "./components/ArticleHeader.jsx";
import ArticleMeta from "./components/ArticleMeta.jsx";
import ArticleTags from "./components/ArticleTags.jsx";
import ArticleFeedback from "./components/ArticleFeedback.jsx";
import ArticleSidebar from "./components/ArticleSidebar.jsx";
import ArticleModals from "./components/ArticleModals.jsx";
import ArticleMedia from "./components/ArticleMedia.jsx";

export default function ArticlePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categoryMap, tagMap, loading: mapsLoading } = useLookupMaps();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [helpfulVote, setHelpfulVote] = useState(null);

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [ratingStats, setRatingStats] = useState({ average: 0, count: 0 });
  const [userAlreadyRated, setUserAlreadyRated] = useState(false);

  // Modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "",
    confirmColor: "#00A368",
    onConfirm: null,
  });
  const [helpfulConfirmModal, setHelpfulConfirmModal] = useState({
    isOpen: false,
    helpful: false,
    onConfirm: null,
  });
  const [resultModal, setResultModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  
  const fetchArticleRating = async (articleId) => {
    try {
      const stats = await getFeedbackStats('article', articleId);
      const avg = stats.avg_rating ?? stats.average ?? 0;
      const cnt = stats.total_ratings ?? stats.count ?? 0;
      
      if (cnt > 0 && avg === 0) {
        const feedbacks = await listFeedback({
          content_type: 'article',
          object_id: articleId,
          page_size: 1000,
        });
        const ratings = (feedbacks.results ?? feedbacks ?? [])
          .filter(f => typeof f.rating === 'number' && f.rating !== null);
        const computedAvg = ratings.length > 0
          ? ratings.reduce((sum, f) => sum + f.rating, 0) / ratings.length
          : 0;
        return { average: computedAvg, count: ratings.length };
      }
      return { average: avg, count: cnt };
    } catch {
      try {
        const feedbacks = await listFeedback({
          content_type: 'article',
          object_id: articleId,
          page_size: 1000,
        });
        const ratings = (feedbacks.results ?? feedbacks ?? [])
          .filter(f => typeof f.rating === 'number' && f.rating !== null);
        const avg = ratings.length > 0
          ? ratings.reduce((sum, f) => sum + f.rating, 0) / ratings.length
          : 0;
        return { average: avg, count: ratings.length };
      } catch {
        return { average: 0, count: 0 };
      }
    }
  };

  // Load article
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

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

    return () => { cancelled = true; };
  }, [slug, user]);

  // Handlers
  const handleHelpfulClick = (helpful) => {
    if (userAlreadyRated) return;
    setHelpfulConfirmModal({
      isOpen: true,
      helpful,
      onConfirm: async () => {
        setHelpfulConfirmModal({ isOpen: false, helpful: false, onConfirm: null });
        const ratingValue = helpful ? 5 : 1;
        try {
          await createFeedback({
            content_type: 'article',
            object_id: article.id,
            helpful,
            rating: ratingValue,
            comment: helpful ? "Thumbs up - helpful" : "Thumbs down - needs improvement",
          });
          setHelpfulVote(helpful);
          setUserAlreadyRated(true);
          setFeedbackSent(true);
          localStorage.setItem(`rated_article_${slug}`, 'true');
          const stats = await fetchArticleRating(article.id);
          setRatingStats(stats);
          openResultModal("success", "Thank you!", `You rated this article ${ratingValue} star${ratingValue > 1 ? 's' : ''}.`);
        } catch (err) {
          openResultModal("error", "Feedback Failed", err.message || "Could not submit your feedback.");
        }
      }
    });
  };

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
  
  const openConfirmModal = (title, message, confirmLabel, onConfirm, confirmColor = "#00A368") => {
    setConfirmModal({ isOpen: true, title, message, confirmLabel, confirmColor, onConfirm });
  };
  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  const openResultModal = (type, title, message) => {
    setResultModal({ isOpen: true, type, title, message });
    setTimeout(() => closeResultModal(), 6000);
  };
  const closeResultModal = () => setResultModal(prev => ({ ...prev, isOpen: false }));

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
          setPublishError(err.response?.data?.error || err.message || "Failed to publish article.");
          openResultModal("error", "Publish Failed", err.message);
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
          setSubmitError(msg);
          openResultModal("error", "Submission Failed", msg);
        } finally {
          setSubmitting(false);
        }
      },
      "#00A368"
    );
  };

  //delete
  const handleDeleteClick = () => {
    openConfirmModal(
      "Delete Article",
      "Are you sure you want to delete this draft? This action is irreversible and cannot be undone.",
      "Delete",
      async () => {
        closeConfirmModal();
        try {
          await deleteArticle(slug);
          navigate("/app/knowledge-base");
          openResultModal("success", "Deleted!", "The article has been permanently removed.");
        } catch (err) {
          openResultModal("error", "Delete Failed", err.message || "Could not delete the article.");
        }
      },
      "#F22F46" 
    );
  };

  if (loading || mapsLoading) {
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

  const isPublished = article.status === 'published';
  const displayRating = isPublished ? ratingStats.average : 0;
  const displayRatingCount = isPublished ? ratingStats.count : 0;

  
  const canViewDetails = user?.role === ROLES.ADMIN || (user?.role === ROLES.EDITOR && article.author === user?.id);

  // show only for drafts and if user can edit
  const showDeleteButton = (user?.role === ROLES.EDITOR || user?.role === ROLES.ADMIN) && article.status === 'draft' && (article.author === user?.id || user?.role === ROLES.ADMIN);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <ArticleHeader 
        article={article} 
        categoryName={categoryMap[article.category]} 
        canEdit={user?.role === ROLES.ADMIN || (user?.role === ROLES.EDITOR && article.author === user?.id)} 
        onDelete={handleDeleteClick}
        showDeleteButton={showDeleteButton}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        <div>
          <ArticleMeta
            article={article}
            authorName={article.author_username}
            updatedDate={article.updated_at}
            views={article.views}
            rating={displayRating}
            ratingCount={displayRatingCount}
            isPublished={isPublished}
            showRatingDetails={canViewDetails} 
          />

          <div className="article-body" dangerouslySetInnerHTML={{ __html: article.content ?? article.body ?? "" }} />
          
          <ArticleTags tags={article.tags} tagMap={tagMap} />
          <ArticleMedia media={article.media}/>
          <ArticleFeedback
            isPublished={isPublished}
            helpfulVote={helpfulVote}
            userAlreadyRated={userAlreadyRated}
            feedbackSent={feedbackSent}
            rating={rating}
            setRating={setRating}
            comment={comment}
            setComment={setComment}
            onHelpfulClick={handleHelpfulClick}
            onSubmitReview={handleSubmitReview}
          />
        </div>

        <ArticleSidebar
          article={article}
          categoryName={categoryMap[article.category]}
          authorName={article.author_username}
          createdDate={article.created_at}
          publishedDate={article.published_at}
          approvedBy={article.publisher_username}
          rating={displayRating}
          ratingCount={displayRatingCount}
          isPublished={isPublished}
          showSubmitButton={user?.role === ROLES.EDITOR && article.status === 'draft' && article.author === user?.id}
          showPublishButton={user?.role === ROLES.ADMIN && article.status === 'pending_review'}
          onPublishClick={handlePublishClick}
          onSubmitClick={handleSubmitClick}
          publishing={publishing}
          submitting={submitting}
          showRatingDetails={canViewDetails} 
        />
      </div>

      <ArticleModals
        confirmModal={confirmModal}
        closeConfirmModal={closeConfirmModal}
        helpfulConfirmModal={helpfulConfirmModal}
        setHelpfulConfirmModal={setHelpfulConfirmModal}
        resultModal={resultModal}
        closeResultModal={closeResultModal}
      />
    </div>
  );
}