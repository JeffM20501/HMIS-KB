import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Menu, X, LogIn } from 'lucide-react';
import Logo from '../common/Logo.jsx';
import { ROUTES } from '../../constants/routes';

const LINKS = [
  { label: 'Home', to: ROUTES.HOME },
  { label: 'Release Notes', to: ROUTES.RELEASE_NOTES },
];

export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const submitSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
        <Logo />

        <nav className="hidden md:flex items-center gap-1 ml-2">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end
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

        <form onSubmit={submitSearch} className="hidden sm:flex flex-1 max-w-sm ml-auto">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the knowledge base..."
              className="w-full h-9 pl-9 pr-3 rounded-full bg-gray-50 border border-transparent text-sm focus-ring focus:bg-white focus:border-primary transition-colors"
            />
          </div>
        </form>

        <NavLink
          to={ROUTES.LOGIN}
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-primary"
        >
          <LogIn className="w-4 h-4" /> Staff Login
        </NavLink>

        <button className="md:hidden ml-auto p-2" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
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
            <NavLink key={l.to} to={l.to} end className="block text-sm font-medium text-text-primary py-1" onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          <NavLink to={ROUTES.LOGIN} className="block text-sm font-medium text-primary py-1">
            Staff Login
          </NavLink>
        </div>
      )}
    </header>
  );
}
