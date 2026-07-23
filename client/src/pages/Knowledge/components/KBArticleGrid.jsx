// src/pages/KnowledgeBase/components/KBArticleGrid.jsx
import { Search, LifeBuoy } from "lucide-react";
import ArticleCard from "../../../components/articles/ArticleCard.jsx";
import EmptyState from "../../../components/common/EmptyState.jsx";

export default function KBArticleGrid({
    articles,
    total,
    query,
    categories,
    tagMap,
    }) {
    if (articles.length === 0) {
    return (
        <EmptyState
        icon={Search}
        title={query ? `No results for "${query}"` : "No articles found"}
        description="Try a different search term, or browse by category. If you still can't find what you need, escalate to support."
        action={
            <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium mt-2"
            style={{ background: "#F22F46", color: "white" }}
            onClick={() => alert("This would open a support ticket with your search context attached.")}
            >
            <LifeBuoy size={14} /> Escalate to support
            </button>
        }
        />
    );
    }

    return (
    <>
        <p className="text-xs mb-4" style={{ color: "#9EA6B3" }}>
        {total} article{total === 1 ? "" : "s"} found
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((a) => (
            <ArticleCard
            key={a.id}
            article={a}
            category={categories.find((c) => String(c.id) === String(a.category))}
            tagMap={tagMap}
            />
        ))}
        </div>
    </>
    );
}