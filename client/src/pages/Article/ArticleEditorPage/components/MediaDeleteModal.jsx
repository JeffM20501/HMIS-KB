import { CheckCircle2, XCircle } from "lucide-react";

export default function MediaDeleteModal({
    isOpen,
    onClose,
    onConfirm,
    mediaName,
    isStaged,
    }) {
    if (!isOpen) return null;

    return (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
    >
        <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
        >
        <h3 className="text-lg font-semibold mb-2" style={{ color: "#121C2D" }}>
            {isStaged ? "Remove Staged File" : "Delete Media"}
        </h3>
        <p className="text-sm mb-6" style={{ color: "#696E7A" }}>
            {isStaged
            ? `Are you sure you want to remove "${mediaName}" from the draft? This action cannot be undone.`
            : `Are you sure you want to permanently delete "${mediaName}"? This action cannot be undone.`}
        </p>
        <div className="flex justify-end gap-3">
            <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E1E3EA", color: "#696E7A" }}
            >
            Cancel
            </button>
            <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ background: "#F22F46" }}
            >
            {isStaged ? "Remove" : "Delete"}
            </button>
        </div>
        </div>
    </div>
    );
}