import { useRef, useState } from "react";
import { Image as ImageIcon, FileText, Video, Upload, X, Loader2, AlertCircle } from "lucide-react";
import { ACCEPTED_MEDIA_TYPES, MAX_MEDIA_SIZE_MB } from "../../utils/constants";

const ALL_ACCEPTED = [
  ...ACCEPTED_MEDIA_TYPES.image,
  ...ACCEPTED_MEDIA_TYPES.pdf,
  ...ACCEPTED_MEDIA_TYPES.video,
].join(",");

function iconFor(type) {
  if (ACCEPTED_MEDIA_TYPES.image.includes(type)) return ImageIcon;
  if (ACCEPTED_MEDIA_TYPES.pdf.includes(type)) return FileText;
  if (ACCEPTED_MEDIA_TYPES.video.includes(type)) return Video;
  return FileText;
}

/**
 * Controlled media uploader. `items` is an array of
 * { id, name, type, size, url?, uploading?, progress?, error? }.
 * `onUpload(file)` should return a promise resolving to the saved media
 * record; `onRemove(id)` deletes an already-uploaded item.
 */
export default function MediaUploader({ items = [], onUpload, onRemove }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState("");

  const validate = (file) => {
    if (!ALL_ACCEPTED.split(",").includes(file.type)) {
      return "Only images (PNG/JPG/GIF/WebP), PDFs, and videos (MP4/WebM/MOV) are supported.";
    }
    if (file.size > MAX_MEDIA_SIZE_MB * 1024 * 1024) {
      return `File is larger than the ${MAX_MEDIA_SIZE_MB}MB limit.`;
    }
    return "";
  };

  const handleFiles = (fileList) => {
    setLocalError("");
    Array.from(fileList).forEach((file) => {
      const err = validate(file);
      if (err) {
        setLocalError(err);
        return;
      }
      onUpload?.(file);
    });
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center text-center rounded-lg border-2 border-dashed py-8 px-4 cursor-pointer transition-colors"
        style={{
          borderColor: dragOver ? "#F22F46" : "#E1E3EA",
          background: dragOver ? "#FDEEF0" : "#F9FAFB",
        }}
      >
        <Upload size={22} className="mb-2" style={{ color: "#9EA6B3" }} />
        <p className="text-sm font-medium" style={{ color: "#243656" }}>
          Drop files here, or click to browse
        </p>
        <p className="text-xs mt-1" style={{ color: "#9EA6B3" }}>
          Screenshots, PDFs, or training videos — optional, up to {MAX_MEDIA_SIZE_MB}MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALL_ACCEPTED}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {localError && (
        <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: "#F22F46" }}>
          <AlertCircle size={13} /> {localError}
        </div>
      )}

      {items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((item) => {
            const Icon = iconFor(item.type);
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 px-3 py-2 rounded-md border"
                style={{ borderColor: "#E1E3EA" }}
              >
                <Icon size={15} style={{ color: "#696E7A", flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "#121C2D" }}>{item.name}</p>
                  {item.uploading ? (
                    <div className="w-full h-1 rounded-full mt-1" style={{ background: "#F4F4F6" }}>
                      <div
                        className="h-1 rounded-full transition-all"
                        style={{ width: `${item.progress ?? 0}%`, background: "#F22F46" }}
                      />
                    </div>
                  ) : item.error ? (
                    <p className="text-xs" style={{ color: "#F22F46" }}>{item.error}</p>
                  ) : (
                    <p className="text-xs" style={{ color: "#9EA6B3" }}>
                      {item.size ? `${(item.size / 1024 / 1024).toFixed(1)} MB` : "Uploaded"}
                    </p>
                  )}
                </div>
                {item.uploading ? (
                  <Loader2 size={14} className="animate-spin" style={{ color: "#9EA6B3" }} />
                ) : (
                  <button
                    type="button"
                    onClick={() => onRemove?.(item.id)}
                    className="p-1 rounded hover:bg-red-50 flex-shrink-0"
                  >
                    <X size={14} style={{ color: "#9EA6B3" }} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
