import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyArticles } from "../api/articles";
import { listCategories } from "../api/categories";
import Spinner from "../components/common/Spinner.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import ArticleCard from "../components/articles/ArticleCard.jsx";
import RoleGate from "../components/common/RoleGate.jsx";
import { ROLES } from "../utils/constants";
import { PlusCircle } from "lucide-react";

export default function EditorDraftsPage() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    // Fetch current user's articles
    getMyArticles()
        .then((data) => {
        if (!cancelled) {
            // Keep only draft articles
            const drafts = (data.results ?? data ?? []).filter(a => a.status === 'draft');
            setArticles(drafts);
        }
        })
        .catch((err) => !cancelled && setError(err.message))
        .finally(() => !cancelled && setLoading(false));

    // Fetch categories for mapping (used in ArticleCard)
    listCategories()
        .then((data) => setCategories(data.results ?? data ?? []))
        .catch(() => {});

    return () => { cancelled = true; };
    }, []);

    if (loading) {
    return <div className="flex justify-center py-20"><Spinner label="Loading your drafts…" /></div>;
    }

    if (error) {
    return <ErrorBanner message={error} />;
    }

    return (
    <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-semibold" style={{ color: "#121C2D" }}>My Drafts</h1>
            <p className="text-sm" style={{ color: "#696E7A" }}>
            Articles you're working on. Only you can see these.
            </p>
        </div>
        <RoleGate allow={[ROLES.EDITOR, ROLES.ADMIN]}>
            <button
            onClick={() => navigate("/app/articles/new")}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "#F22F46" }}
            >
            <PlusCircle size={15} /> New draft
            </button>
        </RoleGate>
        </div>

        {articles.length === 0 ? (
        <div className="text-center py-16" style={{ color: "#696E7A" }}>
            <p className="text-sm">You have no draft articles. Start writing a new one!</p>
            <button
            onClick={() => navigate("/app/articles/new")}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "#F22F46" }}
            >
            <PlusCircle size={15} /> Create new article
            </button>
        </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((a) => (
            <ArticleCard
                key={a.id}
                article={a}
                category={categories.find((c) => c.id === (a.category?.id ?? a.category))}
            />
            ))}
        </div>
        )}
    </div>
    );
}