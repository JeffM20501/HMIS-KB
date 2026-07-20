// src/components/editor/MediaUploader.jsx
import { useRef } from "react";
import { Upload, X, File, Image, FileText, Video, Play, CheckCircle2 } from "lucide-react";

const FILE_ICONS = {
  image: Image,
  pdf: FileText,
  video: Video,
  other: File,
};

export default function MediaUploader({ items, onUpload, onRemove }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpload(file);
      e.target.value = "";
    }
  };

  const getFileIcon = (type) => {
    const Icon = FILE_ICONS[type] || FILE_ICONS.other;
    return <Icon size={24} style={{ color: "#696E7A" }} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const isVisual = (type) => type === "image" || type === "video";

  return (
    <div className="space-y-3">
      {/* Upload area */}
      <div
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
        style={{ borderColor: "#E1E3EA" }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/pdf,video/*"
        />
        <Upload size={24} className="mx-auto mb-2" style={{ color: "#9EA6B3" }} />
        <p className="text-sm" style={{ color: "#696E7A" }}>
          Click to upload or drag & drop
        </p>
        <p className="text-xs mt-1" style={{ color: "#9EA6B3" }}>
          Images, PDFs, or videos (max 50MB)
        </p>
      </div>

      {/* Media grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => {
            const isUploading = item.uploading;
            const isError = item.error;
            const isSuccess = item.uploaded && !isUploading && !isError;
            const isVisualMedia = isVisual(item.type);
            const previewUrl = item.type === "image" && item.url ? item.url : null;

            return (
              <div
                key={item.id}
                className={`relative flex flex-col items-center p-4 rounded-lg border ${
                  isError ? "border-red-500" : "border-gray-200"
                } ${isVisualMedia ? "col-span-1 sm:col-span-2" : ""}`}
                style={{ borderColor: isError ? "#F22F46" : "#E1E3EA" }}
              >
                {/* Upload progress overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-white/75 flex flex-col items-center justify-center rounded-lg z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-1 rounded-full transition-all"
                          style={{
                            width: `${item.progress || 0}%`,
                            background: "#F22F46",
                          }}
                        />
                      </div>
                      <span className="text-xs" style={{ color: "#9EA6B3" }}>
                        {item.progress || 0}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Media preview */}
                {item.type === "image" && previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={item.name}
                    className="w-full h-32 object-cover rounded-md mb-2"
                  />
                ) : item.type === "video" && item.url ? (
                  <div
                    className="relative w-full h-32 rounded-md mb-2 overflow-hidden"
                    style={{ background: "#F4F4F6" }}
                  >
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="rounded-full bg-white/90 p-2 shadow-md">
                        <Play size={16} style={{ color: "#121C2D", fill: "#121C2D" }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-center w-full h-32 rounded-md mb-2"
                    style={{ background: "#F4F4F6" }}
                  >
                    {item.type === "pdf" ? (
                      <div className="flex flex-col items-center">
                        <FileText size={48} style={{ color: "#F22F46" }} />
                        <span className="text-xs mt-1 font-medium" style={{ color: "#696E7A" }}>
                          PDF
                        </span>
                      </div>
                    ) : (
                      getFileIcon(item.type)
                    )}
                  </div>
                )}

                <div className="flex items-center justify-center gap-1.5 w-full">
                  <span className="text-xs font-medium text-center truncate flex-1" style={{ color: "#121C2D" }}>
                    {item.name}
                  </span>
                  {isSuccess && <CheckCircle2 size={14} style={{ color: "#00A368", flexShrink: 0 }} />}
                </div>

                {!isUploading && !isError && (
                  <span className="text-xs" style={{ color: "#9EA6B3" }}>
                    {formatFileSize(item.size)}
                  </span>
                )}
                {isError && (
                  <span className="text-xs" style={{ color: "#F22F46" }}>
                    {item.error || "Upload failed"}
                  </span>
                )}

                {/* Remove button */}
                <button
                  onClick={() => onRemove(item.id)}
                  disabled={isUploading}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-40"
                  style={{ color: "#696E7A", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}