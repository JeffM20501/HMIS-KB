// src/pages/Admin/CategoryModal.jsx
import { useState } from "react";
import { X, XCircle, Plus, Loader2 } from "lucide-react";
import { createCategory } from "../../../api/categories";

export default function CategoryModal({ isOpen, onClose, categories, onSuccess }) {
    const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    parent: "",
    sort_order: 0,
    icon: "",
    });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleNameChange = (name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setForm({ ...form, name, slug });
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
        const newCat = await createCategory(form);
        onSuccess(newCat);
        setForm({ name: "", slug: "", description: "", parent: "", sort_order: 0, icon: "" });
        onClose();
    } catch (err) {
        setError(err.response?.data?.detail || err.message || "Failed to create category.");
    } finally {
        setSubmitting(false);
    }
    };

    if (!isOpen) return null;

    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold" style={{ color: "#121C2D" }}>Add New Category</h3>
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 transition-colors">
            <X size={18} style={{ color: "#696E7A" }} />
            </button>
        </div>
        {error && (
            <div className="mb-3 text-xs text-red-600 flex items-center gap-1">
            <XCircle size={14} /> {error}
            </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
            <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#696E7A" }}>Name *</label>
            <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-md border outline-none"
                style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            />
            </div>
            <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#696E7A" }}>Slug</label>
            <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-md border outline-none"
                style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            />
            </div>
            <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#696E7A" }}>Description</label>
            <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-md border outline-none resize-none"
                style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            />
            </div>
            <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#696E7A" }}>Parent Category</label>
            <select
                value={form.parent}
                onChange={(e) => setForm({ ...form, parent: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-md border outline-none"
                style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            >
                <option value="">None (Root)</option>
                {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
            </div>
            <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#696E7A" }}>Sort Order</label>
            <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm rounded-md border outline-none"
                style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            />
            </div>
            <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#696E7A" }}>Icon (emoji or name)</label>
            <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="e.g. rocket, user, settings"
                className="w-full px-3 py-2 text-sm rounded-md border outline-none"
                style={{ borderColor: "#E1E3EA", color: "#121C2D" }}
            />
            </div>
            <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium border" style={{ borderColor: "#E1E3EA", color: "#696E7A" }}>
                Cancel
            </button>
            <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "#F22F46" }}
            >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Create
            </button>
            </div>
        </form>
        </div>
    </div>
    );
}