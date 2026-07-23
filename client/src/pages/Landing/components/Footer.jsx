// src/pages/Landing/components/Footer.jsx
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
    return (
    <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-md w-6 h-6 bg-red-500">
            <BookOpen size={12} color="white" />
            </div>
            <span className="text-sm font-medium text-ink-dark">HealthKB</span>
        </Link>
        <p className="text-xs text-ink-lighter">&copy; 2026 HealthKB &middot; Built for HMIS &middot; Nairobi, Kenya</p>
        <div className="flex items-center gap-4 text-xs text-ink-lighter">
            <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Security</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Contact</a>
        </div>
        </div>
    </footer>
    );
}