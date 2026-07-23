import { Link } from "react-router-dom";
import { BookOpen, Menu, X } from "lucide-react";

export default function Header({ mobileMenuOpen, setMobileMenuOpen }) {
    return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm border-gray-200">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2.5">
            <div className="flex items-center justify-center rounded-md w-8 h-8 bg-red-500">
            <BookOpen size={16} color="white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-base text-ink-darkest">HealthKB</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-ink">
            <a href="#features" className="hover:text-red-600 transition-colors">Features</a>
            <a href="#categories" className="hover:text-red-600 transition-colors">Categories</a>
            <a href="#testimonials" className="hover:text-red-600 transition-colors">Testimonials</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium px-4 py-2 rounded-md transition-colors hover:bg-gray-100 text-ink-dark">
            Sign in
            </Link>
            <Link to="/register" className="text-sm font-medium px-4 py-2 rounded-md transition-opacity hover:opacity-90 bg-red-500 text-white">
            Get access
            </Link>
        </div>

        <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} className="text-ink-dark" /> : <Menu size={20} className="text-ink-dark" />}
        </button>
        </div>

        {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 px-6 py-4 space-y-3">
            <a href="#features" className="block text-sm py-1 text-ink">Features</a>
            <a href="#categories" className="block text-sm py-1 text-ink">Categories</a>
            <a href="#testimonials" className="block text-sm py-1 text-ink">Testimonials</a>
            <div className="flex gap-3 pt-2">
            <Link to="/login" className="flex-1 py-2 rounded-md text-sm border font-medium text-center border-gray-200 text-ink-dark">Sign in</Link>
            <Link to="/register" className="flex-1 py-2 rounded-md text-sm font-medium text-center bg-red-500 text-white">Get access</Link>
            </div>
        </div>
        )}
    </header>
    );
}