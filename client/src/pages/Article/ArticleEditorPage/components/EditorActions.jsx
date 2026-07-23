import { Loader2, Save, Send, CheckCircle2 } from "lucide-react";

export default function EditorActions({
    status,
    saving,
    onSaveDraft,
    onSubmitForReview,
    onPublish,
    isAdmin,
}) {
    return (
    <div className="flex items-center justify-between sticky bottom-0 bg-white/95 backdrop-blur-sm rounded-lg border p-4" style={{ borderColor: "#E1E3EA" }}>
        <span className="text-xs" style={{ color: "#9EA6B3" }}>
        Current status: <strong className="capitalize" style={{ color: "#243656" }}>{status}</strong>
        </span>
        <div className="flex items-center gap-2.5">
        <button onClick={onSaveDraft} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:bg-gray-50 disabled:opacity-60" style={{ borderColor: "#E1E3EA", color: "#243656" }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save draft
        </button>
        <button onClick={onSubmitForReview} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60" style={{ background: "#F22F46", color: "white" }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Submit for review
        </button>
        {isAdmin && (
            <button onClick={onPublish} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors disabled:opacity-60" style={{ borderColor: "#00A368", color: "#00A368" }}>
            <CheckCircle2 size={14} /> Publish
            </button>
        )}
        </div>
    </div>
    );
}