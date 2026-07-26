import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Menu, X, LogIn, ShieldCheck } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

// "Categories" and "Contact" don't have dedicated index pages yet — they
// anchor-scroll to the matching sections on the Home page (see HomePage.jsx
// section ids) rather than 404ing or inventing new routes outside this
// task's scope. "What's New" reuses the existing /release-notes route with
// a relabeled nav entry.
const LINKS = [
  { label: 'Home', to: ROUTES.HOME, end: true },
  { label: 'Categories', to: `${ROUTES.HOME}#categories` },
  { label: "What's New", to: ROUTES.RELEASE_NOTES },
  { label: 'Contact', to: `${ROUTES.HOME}#contact` },
];

export default function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const submitSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
        <Link to={ROUTES.HOME} className="flex items-center gap-2.5 shrink-0">
          <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </span>
          <span className="text-[15px] font-bold text-text-primary">
            TaifaCare <span className="font-normal text-text-secondary">Help Center</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `px-3 py-2 rounded text-sm font-medium ${
                  isActive ? 'text-primary bg-primary-50' : 'text-text-secondary hover:text-text-primary'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="hidden sm:flex p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-gray-50"
            aria-label="Search"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          <Link
            to={ROUTES.LOGIN}
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-4 rounded border border-border text-sm font-medium text-text-primary hover:bg-gray-50"
          >
            Sign in
          </Link>

          <button className="md:hidden p-2" onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="hidden sm:block border-t border-border px-6 py-3 bg-gray-50/60">
          <form onSubmit={submitSearch} className="max-w-xl mx-auto relative">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the knowledge base..."
              className="w-full h-10 pl-9 pr-3 rounded-full bg-white border border-border text-sm focus-ring focus:border-primary transition-colors"
            />
          </form>
        </div>
      )}

      {mobileOpen && (
        <div className="md:hidden border-t border-border px-6 py-4 space-y-3">
          <form onSubmit={submitSearch} className="relative">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full h-9 pl-9 pr-3 rounded-full bg-gray-50 border border-border text-sm"
            />
          </form>
          {LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="block text-sm font-medium text-text-primary py-1"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link to={ROUTES.LOGIN} className="flex items-center gap-1.5 text-sm font-medium text-primary py-1">
            <LogIn className="w-4 h-4" /> Sign in
          </Link>
        </div>
      )}
    </header>
  );
}
