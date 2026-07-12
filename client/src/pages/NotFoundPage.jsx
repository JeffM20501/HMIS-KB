import { Link } from "react-router-dom";
import { BookOpen, ArrowLeft, Search } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F4F4F6", fontFamily: "var(--font-inter)" }}>
      <div className="text-center max-w-sm">
        <div className="flex items-center justify-center rounded-full mx-auto mb-5" style={{ width: 56, height: 56, background: "#FDEEF0" }}>
          <BookOpen size={26} style={{ color: "#F22F46" }} />
        </div>
        <h1 className="text-3xl font-semibold mb-2" style={{ color: "#121C2D" }}>404</h1>
        <p className="text-sm mb-7" style={{ color: "#696E7A" }}>
          We couldn't find that page. It may have been moved, archived, or the link may be incorrect.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/app/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90" style={{ background: "#F22F46", color: "white" }}>
            <ArrowLeft size={14} /> Back to dashboard
          </Link>
          <Link to="/app/knowledge-base" className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors hover:bg-gray-50" style={{ borderColor: "#E1E3EA", color: "#243656" }}>
            <Search size={14} /> Search KB
          </Link>
        </div>
      </div>
    </div>
  );
}
