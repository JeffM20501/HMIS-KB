import { ThumbsUp, ThumbsDown, CheckCircle2, LifeBuoy } from "lucide-react";
import StarRating from "../../../../components/common/StarRating";

export default function ArticleFeedback({
    isPublished,
    helpfulVote,
    userAlreadyRated,
    feedbackSent,
    rating,
    setRating,
    comment,
    setComment,
    onHelpfulClick,
    onSubmitReview,
}) {
    if (!isPublished) {
    return (
        <div className="mt-8 p-5 rounded-lg text-center" style={{ background: "#F9FAFB", border: "1px solid #E8E8EC" }}>
        <LifeBuoy size={16} className="inline mr-2" style={{ color: "#696E7A" }} />
        <span className="text-sm" style={{ color: "#696E7A" }}>
            Feedback is only available for published articles. Please check back once this article is published.
        </span>
        </div>
    );
    }

    return (
    <div className="mt-8 p-5 rounded-lg" style={{ background: "#F9FAFB", border: "1px solid #E8E8EC" }}>
        <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium" style={{ color: "#121C2D" }}>Was this article helpful?</p>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
            <button
                onClick={() => onHelpfulClick(true)}
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
                onClick={() => onHelpfulClick(false)}
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
            {userAlreadyRated
            ? "You've already rated this article. Thank you!"
            : "Thanks — your feedback helps us keep this article accurate."}
        </div>
        ) : (
        <>
            {!userAlreadyRated ? (
            <form onSubmit={onSubmitReview} className="space-y-3 mt-4">
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
            )}
        </>
        )}
    </div>
    );
}