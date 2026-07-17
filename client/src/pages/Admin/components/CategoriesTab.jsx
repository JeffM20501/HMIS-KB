// src/pages/Admin/CategoriesTab.jsx
import { Plus, FileText, Trash2 } from "lucide-react";

export default function CategoriesTab({ categories, busyId, onDeleteCategory, onOpenModal }) {
    return (
    <div>
        <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold" style={{ color: "#121C2D" }}>Manage Categories</h2>
        <button
            onClick={onOpenModal}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: "#F22F46", color: "white" }}
        >
            <Plus size={15} /> New Category
        </button>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden overflow-x-auto" style={{ borderColor: "#E1E3EA" }}>
        <table className="w-full">
            <thead>
            <tr style={{ background: "#FAFAFA" }}>
                {["Name", "Slug", "Parent", "Articles", "Actions"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: "#9EA6B3" }}>
                    {h}
                </th>
                ))}
            </tr>
            </thead>
            <tbody>
            {categories.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F4F4F6" }}>
                <td className="px-5 py-3.5">
                    <span className="text-sm font-medium" style={{ color: "#121C2D" }}>{c.name}</span>
                </td>
                <td className="px-5 py-3.5 text-xs" style={{ color: "#696E7A" }}>{c.slug}</td>
                <td className="px-5 py-3.5 text-xs" style={{ color: "#696E7A" }}>
                    {c.parent_name || "—"}
                </td>
                <td className="px-5 py-3.5 text-xs" style={{ color: "#696E7A" }}>
                    {c.article_count || 0}
                </td>
                <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                    <button className="p-1 rounded hover:bg-gray-100 transition-colors" title="Edit">
                        <FileText size={13} style={{ color: "#696E7A" }} />
                    </button>
                    <button
                        onClick={() => onDeleteCategory(c)}
                        disabled={busyId === c.id}
                        className="p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="Delete"
                    >
                        <Trash2 size={13} style={{ color: "#9EA6B3" }} />
                    </button>
                    </div>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    </div>
    );
}