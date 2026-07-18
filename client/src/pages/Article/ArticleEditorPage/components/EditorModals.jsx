import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";

export default function EditorModals({
    confirmModal,
    closeConfirmModal,
    resultModal,
    closeResultModal,
}) {
    const navigate = useNavigate();

    return (
    <>
        {/* ---- Confirmation Modal ---- */}
        {confirmModal.isOpen && (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={closeConfirmModal}
        >
            <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
            >
            <h3 className="text-lg font-semibold mb-2" style={{ color: "#121C2D" }}>
                {confirmModal.title}
            </h3>
            <p className="text-sm mb-6" style={{ color: "#696E7A" }}>
                {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3">
                <button
                onClick={closeConfirmModal}
                className="px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:bg-gray-50"
                style={{ borderColor: "#E1E3EA", color: "#696E7A" }}
                >
                Cancel
                </button>
                <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors hover:opacity-90"
                style={{ background: confirmModal.confirmColor }}
                >
                {confirmModal.confirmLabel}
                </button>
            </div>
            </div>
        </div>
        )}

        {/* ---- Result Modal ---- */}
        {resultModal.isOpen && (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={closeResultModal}
        >
            <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center"
            onClick={(e) => e.stopPropagation()}
            >
            {resultModal.type === "success" ? (
                <CheckCircle2 size={48} style={{ color: "#00A368" }} className="mx-auto mb-3" />
            ) : (
                <XCircle size={48} style={{ color: "#F22F46" }} className="mx-auto mb-3" />
            )}
            <h3 className="text-lg font-semibold mb-2" style={{ color: "#121C2D" }}>
                {resultModal.title}
            </h3>
            <p className="text-sm mb-6" style={{ color: "#696E7A" }}>
                {resultModal.message}
            </p>
            <div className="flex justify-center gap-3">
                {resultModal.type === "success" && (
                <button
                    onClick={() => {
                    closeResultModal();
                    navigate("/app/knowledge-base");
                    }}
                    className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors hover:opacity-90"
                    style={{ background: "#00A368" }}
                >
                    Back to Knowledge Base
                </button>
                )}
                <button
                onClick={closeResultModal}
                className="px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:bg-gray-50"
                style={{ borderColor: "#E1E3EA", color: "#696E7A" }}
                >
                Close
                </button>
            </div>
            </div>
        </div>
        )}
    </>
    );
}