import { Clock, Eye, Star } from "lucide-react";

export default function ArticleMeta({
        authorName,
        updatedDate,
        views,
        rating,
        ratingCount,
        isPublished,
        showRatingDetails, 
    }) {
    const renderRating = () => {
    if (!isPublished) return null;
    if (ratingCount === 0) {
        return (
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "#9EA6B3" }}>
            <Star size={12} style={{ color: "#E1E3EA", fill: "#E1E3EA" }} />
            No ratings yet
        </span>
        );
    }
    // Show average rating always, but only show count if user is admin/author
    const ratingDisplay = (
        <span className="flex items-center gap-1.5">
        <Star size={12} style={{ color: "#F7C948", fill: "#F7C948" }} />
        {rating.toFixed(1)}
        {showRatingDetails && (
            <span style={{ color: "#9EA6B3" }}>
            ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
            </span>
        )}
        </span>
    );
    return ratingDisplay;
    };

    return (
    <div
        className="flex flex-wrap items-center gap-4 text-xs mb-6 pb-6 border-b"
        style={{ color: "#696E7A", borderColor: "#E8E8EC" }}
    >
        <div className="flex items-center gap-2">
        <div
            className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
            style={{ width: 28, height: 28, background: "#F22F46", color: "white" }}
        >
            {authorName?.charAt(0).toUpperCase() || "U"}
        </div>
        <span style={{ color: "#121C2D" }}>{authorName || "Unknown Author"}</span>
        </div>
        <span className="flex items-center gap-1.5">
        <Clock size={12} /> Updated {updatedDate ? new Date(updatedDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Recently"}
        </span>
        <span className="flex items-center gap-1.5">
        <Eye size={12} /> {(views ?? 0).toLocaleString()} views
        </span>
        {renderRating()}
    </div>
    );
}