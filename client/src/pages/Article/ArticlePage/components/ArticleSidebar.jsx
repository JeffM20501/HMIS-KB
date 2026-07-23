import { useNavigate } from "react-router-dom";
import { Star, Check, Loader2, LifeBuoy } from "lucide-react";
import RoleGate from "../../../../components/common/RoleGate.jsx";
import { ROLES } from "../../../../utils/constants.js";

export default function ArticleSidebar({
    article,
    categoryName,
    authorName,
    createdDate,
    publishedDate,
    approvedBy,
    rating,
    ratingCount,
    isPublished,
    showSubmitButton,
    showPublishButton,
    onPublishClick,
    onSubmitClick,
    publishing,
    submitting,
    showRatingDetails
}) {
    const navigate = useNavigate();

    const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    };

    return (
    <aside className="space-y-5">
        {/* Article Meta Card */}
        <div className="bg-white rounded-lg border p-4" style={{ borderColor: "#E1E3EA" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#9EA6B3" }}>
            Article Information
            </p>
            <div className="space-y-2 text-sm">
            <div className="flex justify-between">
                <span style={{ color: "#696E7A" }}>Author</span>
                <span style={{ color: "#121C2D" }}>{authorName || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
                <span style={{ color: "#696E7A" }}>Category</span>
                <span style={{ color: "#121C2D" }}>{categoryName || "Uncategorized"}</span>
            </div>
            <div className="flex justify-between">
                <span style={{ color: "#696E7A" }}>Created</span>
                <span style={{ color: "#121C2D" }}>{formatDate(createdDate)}</span>
            </div>
            <div className="flex justify-between">
                <span style={{ color: "#696E7A" }}>Published</span>
                <span style={{ color: "#121C2D" }}>{isPublished ? formatDate(publishedDate) : "Draft"}</span>
            </div>
            <div className="flex justify-between">
                <span style={{ color: "#696E7A" }}>Approved by</span>
                <span style={{ color: "#121C2D" }}>{approvedBy || "Not approved"}</span>
            </div>
            {isPublished && (
                <div className="flex justify-between">
                <span style={{ color: "#696E7A" }}>Rating</span>
                <span style={{ color: "#121C2D" }} className="flex items-center gap-1">
                    {ratingCount === 0 ? (
                    <>
                        <Star size={12} style={{ color: "#E1E3EA", fill: "#E1E3EA" }} />
                        No ratings
                    </>
                    ) : (
                    <>
                        <Star size={12} style={{ color: "#F7C948", fill: "#F7C948" }} />
                        {rating.toFixed(1)}
                        {showRatingDetails && (
                        <span style={{ color: "#9EA6B3", fontSize: "0.75rem" }}>
                            ({ratingCount})
                        </span>
                        )}
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
            onClick={onSubmitClick}
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
            onClick={onPublishClick}
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
                <a
                key={item.id}
                href={`#${item.id}`}
                className="block text-xs hover:underline"
                style={{ color: "#455A77" }}
                >
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
    );
}