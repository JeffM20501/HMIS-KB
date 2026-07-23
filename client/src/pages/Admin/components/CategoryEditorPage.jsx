import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, CheckCircle2 } from "lucide-react";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../../../api/categories.js";
import ErrorBanner from "../../../components/common/ErrorBanner.jsx";
import Spinner from "../../../components/common/Spinner.jsx";

export default function CategoryEditorPage() {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);
    const [categories, setCategories] = useState([]);

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [parentId, setParentId] = useState("");
    const [sortOrder, setSortOrder] = useState(0);
    const [icon, setIcon] = useState("");

    // Load categories for parent selection
    useEffect(() => {
    listCategories()
        .then((data) => setCategories(data.results ?? data ?? []))
        .catch(() => setCategories([]));
    }, []);

    // Load existing category in edit mode
    useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    // We need a getCategory API call – add to api/categories.js
    // For now, we'll filter from the list (but in production, fetch by ID)
    const category = categories.find((c) => c.id === parseInt(id));
    if (category) {
        setName(category.name || "");
        setSlug(category.slug || "");
        setDescription(category.description || "");
        setParentId(category.parent_id || "");
        setSortOrder(category.sort_order || 0);
        setIcon(category.icon || "");
    }
    setLoading(false);
    return () => { cancelled = true; };
    }, [id, isEditMode, categories]);

    const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
        setError("Category name is required.");
        return;
    }
    setError("");
    setSaving(true);
    try {
        const payload = {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
        description,
        parent: parentId || null,
        sort_order: parseInt(sortOrder) || 0,
        icon,
        };

        let result;
        if (isEditMode) {
        result = await updateCategory(id, payload);
        } else {
        result = await createCategory(payload);
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        // Navigate back to admin after a moment
        setTimeout(() => navigate("/app/admin"), 1500);
    } catch (err) {
        setError(err.message || "Couldn't save category.");
    } finally {
        setSaving(false);
    }
    };

    const handleDelete = async () => {
    if (!window.confirm(`Delete category "${name}"? This will remove the category from all articles.`)) return;
    setSaving(true);
    try {
        await deleteCategory(id);
        navigate("/app/admin");
    } catch (err) {
        setError(err.message);
    } finally {
        setSaving(false);
    }
    };

  if (loading) return <div className="flex justify-center py-20"><Spinner label="Loading category…" /></div>;

    return (
    <div className="max-w-3xl mx-auto px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs mb-6 hover:underline" style={{ color: "#696E7A" }}>
        <ArrowLeft size={13} /> Back
        </button>

        <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: "#121C2D" }}>
            {isEditMode ? "Edit Category" : "New Category"}
        </h1>
        {saved && (
            <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#00A368" }}>
            <CheckCircle2 size={15} /> Saved
            </span>
        )}
        </div>

        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-5" style={{ borderColor: "#E1E3EA" }}>
        <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>
            Name <span style={{ color: "#F22F46" }}>*</span>
            </label>
            <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Patient Management"
            className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none focus:border-red-500 transition-colors"
            style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>
            Slug
            </label>
            <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. patient-management"
            className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none focus:border-red-500 transition-colors"
            style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            />
            <p className="text-xs mt-1" style={{ color: "#9EA6B3" }}>
            The slug is used in the URL. Auto-generated from name if left empty.
            </p>
        </div>

        <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>
            Description
            </label>
            <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief description of this category…"
            className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none resize-y focus:border-red-500 transition-colors"
            style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>
            Parent Category
            </label>
            <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none focus:border-red-500 transition-colors"
            style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            >
            <option value="">None (Top-level)</option>
            {categories
                .filter((c) => c.id !== parseInt(id)) // Prevent self-reference
                .map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
        </div>

        <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>
            Sort Order
            </label>
            <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-32 px-3.5 py-2.5 text-sm rounded-md border outline-none focus:border-red-500 transition-colors"
            style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            />
        </div>

        <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#243656" }}>
            Icon (optional)
            </label>
            <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="fa-user or emoji"
            className="w-full px-3.5 py-2.5 text-sm rounded-md border outline-none focus:border-red-500 transition-colors"
            style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            />
        </div>

        <div className="flex items-center gap-3 pt-2">
            <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-60"
            style={{ background: "#F22F46", color: "white" }}
            >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isEditMode ? "Update Category" : "Create Category"}
            </button>
            {isEditMode && (
            <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="px-5 py-2.5 rounded-md text-sm font-medium border transition-colors hover:bg-red-50"
                style={{ borderColor: "#E1E3EA", color: "#F22F46" }}
            >
                Delete Category
            </button>
            )}
        </div>
        </form>

        <div className="mt-6 p-4 rounded-lg" style={{ background: "#F9FAFB", border: "1px solid #E8E8EC" }}>
        <p className="text-sm font-medium mb-2" style={{ color: "#121C2D" }}>ℹ️ Categories & Templates</p>
        <p className="text-xs" style={{ color: "#696E7A" }}>
            Categories organize articles (e.g., "Patient Management", "Clinical Modules").<br />
            <strong>Templates</strong> (How-To, SOP, FAQ, etc.) are selected separately when writing an article.
        </p>
        </div>
    </div>
    );
}