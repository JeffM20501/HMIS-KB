import { CheckCircle2 } from "lucide-react";

export default function SavedBadge({ show }) {
    if (!show) return null;
    return (
    <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#00A368" }}>
        <CheckCircle2 size={15} /> Saved
    </span>
    );
}