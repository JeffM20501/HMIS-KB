import { AlertCircle } from "lucide-react";

export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-3 rounded-md text-sm"
      style={{ background: "#FDEEF0", border: "1px solid rgba(242,47,70,0.2)", color: "#C21B2E" }}
    >
      <AlertCircle size={15} className="flex-shrink-0" />
      {message}
    </div>
  );
}
