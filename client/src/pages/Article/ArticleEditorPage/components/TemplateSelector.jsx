import { ARTICLE_TYPES, ARTICLE_TYPE_LABELS, TEMPLATE_SECTIONS } from "../../../../utils/constants";
import { BookMarked, ClipboardList, HelpCircle, Wrench, FileQuestion, Rss } from "lucide-react";

const TEMPLATE_ICONS = {
    [ARTICLE_TYPES.HOW_TO]: BookMarked,
    [ARTICLE_TYPES.SOP]: ClipboardList,
    [ARTICLE_TYPES.FAQ]: HelpCircle,
    [ARTICLE_TYPES.TROUBLESHOOTING]: Wrench,
    [ARTICLE_TYPES.FEATURE_REF]: FileQuestion,
    [ARTICLE_TYPES.RELEASE_NOTES]: Rss,
};

export default function TemplateSelector({ onSelect }) {
    return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(ARTICLE_TYPE_LABELS).map(([key, label]) => {
        const Icon = TEMPLATE_ICONS[key];
        return (
            <button
            key={key}
            onClick={() => onSelect(key)}
            className="flex flex-col items-start text-left p-5 rounded-lg border hover:border-red-300 transition-colors"
            style={{ borderColor: "#E1E3EA" }}
            >
            <div className="flex items-center justify-center rounded-lg mb-3" style={{ width: 40, height: 40, background: "#FDEEF0" }}>
                <Icon size={18} style={{ color: "#F22F46" }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: "#121C2D" }}>{label}</p>
            <p className="text-xs" style={{ color: "#9EA6B3" }}>{TEMPLATE_SECTIONS[key].join(" · ")}</p>
            </button>
        );
        })}
    </div>
    );
}