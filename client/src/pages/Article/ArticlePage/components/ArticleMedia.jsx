// src/pages/ArticlePage/components/ArticleMedia.jsx
import { Image, File, Video, FileText, Play } from "lucide-react";

const MEDIA_ICONS = {
    image: Image,
    video: Video,
    pdf: FileText,
    other: File,
};

export default function ArticleMedia({ media }) {
    if (!media || media.length === 0) return null;

    const getIcon = (type) => {
        const Icon = MEDIA_ICONS[type] || MEDIA_ICONS.other;
        return <Icon size={24} style={{ color: "#696E7A" }} />;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    };

    const isVisual = (type) => type === "image" || type === "video";

    return (
        <div className="mt-8 pt-6 border-t" style={{ borderColor: "#E8E8EC" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "#9EA6B3" }}>
                Attachments
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {media.map((m) => {
                    const isVisualMedia = isVisual(m.type);
                    return (
                        <a
                            key={m.id}
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex flex-col items-center p-4 rounded-lg border hover:shadow-md transition-shadow ${
                                isVisualMedia ? "col-span-1 sm:col-span-2" : ""
                            }`}
                            style={{ borderColor: "#E1E3EA" }}
                        >
                            {m.type === "image" ? (
                                <img
                                    src={m.url}
                                    alt={m.filename}
                                    className="w-full h-40 object-cover rounded-md mb-2"
                                />
                            ) : m.type === "video" ? (
                                <div
                                    className="relative w-full h-40 rounded-md mb-2 overflow-hidden"
                                    style={{ background: "#F4F4F6" }}
                                >
                                    <video
                                        src={m.url}
                                        className="w-full h-full object-cover"
                                        muted
                                        preload="metadata"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                                        <div className="rounded-full bg-white/90 p-2.5 shadow-md">
                                            <Play size={20} style={{ color: "#121C2D", fill: "#121C2D" }} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // PDF or other files – show icon card
                                <div
                                    className="flex items-center justify-center w-full h-40 rounded-md mb-2"
                                    style={{ background: "#F4F4F6" }}
                                >
                                    <div className="flex flex-col items-center">
                                        <FileText size={48} style={{ color: "#F22F46" }} />
                                        <span className="text-xs mt-1 font-medium" style={{ color: "#696E7A" }}>
                                            PDF
                                        </span>
                                    </div>
                                </div>
                            )}
                            <span className="text-xs font-medium text-center truncate w-full" style={{ color: "#121C2D" }}>
                                {m.filename}
                            </span>
                            <span className="text-xs" style={{ color: "#9EA6B3" }}>
                                {formatDate(m.created_at)}
                            </span>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}