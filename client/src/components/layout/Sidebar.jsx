import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Settings, Users, Shield, CreditCard,
  Stethoscope, Tag, LogOut, ChevronDown, X, Wrench, BookMarked,
  SlidersHorizontal, PlusCircle, // ✅ Added PlusCircle icon
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { ROLES } from "../../utils/constants";
import { useEffect, useState } from "react";
import { listCategories } from "../../api/categories";

const navItems = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { to: "/app/admin", label: "Admin Panel", icon: Settings, adminOnly: true },
  // ✅ NEW: Editor-only nav item for creating articles
  { to: "/app/articles/new", label: "New Article", icon: PlusCircle, editorOnly: true },
  { to: "/app/settings", label: "Settings", icon: SlidersHorizontal },
];

const categoryColors = ["#0263E0", "#00A368", "#E87722", "#7B2FBE", "#F22F46", "#243656", "#C21B2E", "#696E7A"];
const categoryIcons = [BookMarked, Users, Stethoscope, CreditCard, Settings, Shield, Wrench, Tag];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    listCategories()
      .then((data) => setCategories(data.results ?? data ?? []))
      .catch(() => setCategories([]));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed lg:relative z-30 flex flex-col h-full transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ width: 240, minWidth: 240, background: "#06033A" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-center rounded-md" style={{ width: 32, height: 32, background: "#F22F46" }}>
            <BookOpen size={16} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight" style={{ color: "#FFFFFF" }}>HealthKB</div>
            <div className="text-xs leading-tight" style={{ color: "rgba(255,255,255,0.45)" }}>HMIS Knowledge Base</div>
          </div>
          <button className="ml-auto lg:hidden" onClick={onClose} style={{ color: "rgba(255,255,255,0.5)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-0.5">
            {navItems.map((item) => {
              // ✅ Handle admin-only items
              if (item.adminOnly && user?.role !== ROLES.ADMIN) return null;
              // ✅ Handle editor-only items (visible to editors AND admins)
              if (item.editorOnly && user?.role !== ROLES.EDITOR && user?.role !== ROLES.ADMIN) return null;
              
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium transition-colors"
                  style={({ isActive }) => ({
                    background: isActive ? "rgba(242,47,70,0.15)" : "transparent",
                    color: isActive ? "#F22F46" : "rgba(255,255,255,0.65)",
                    borderLeft: isActive ? "2px solid #F22F46" : "2px solid transparent",
                  })}
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>

          {/* Category shortcuts */}
          <div className="mt-6 px-3">
            <button
              className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.35)" }}
              onClick={() => setCategoriesExpanded((v) => !v)}
            >
              <span>Categories</span>
              <ChevronDown
                size={12}
                style={{
                  transform: categoriesExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                  transition: "transform 0.2s",
                }}
              />
            </button>
            {categoriesExpanded && (
              <div className="mt-1 space-y-0.5">
                {categories.slice(0, 8).map((cat, i) => {
                  const color = categoryColors[i % categoryColors.length];
                  const Icon = categoryIcons[i % categoryIcons.length];
                  return (
                    <button
                      key={cat.id ?? cat.slug ?? cat.name}
                      onClick={() => {
                        navigate(`/app/knowledge-base?category=${cat.id ?? cat.slug ?? ""}`);
                        onClose();
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-xs transition-colors hover:bg-white/5"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      <span className="flex-shrink-0" style={{ width: 6, height: 6, background: color, borderRadius: 2 }} />
                      <Icon size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* User footer */}
        <div className="border-t p-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-2 py-2 rounded-md hover:bg-white/5 cursor-pointer transition-colors text-left"
          >
            <div className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0" style={{ width: 28, height: 28, background: "#F22F46", color: "white" }}>
              {user?.avatar ?? (user?.name ? user.name.slice(0, 2).toUpperCase() : "?")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
                {user?.name}
              </div>
              <div className="text-xs truncate capitalize" style={{ color: "rgba(255,255,255,0.35)" }}>
                {user?.role}
              </div>
            </div>
            <LogOut size={14} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
          </button>
        </div>
      </aside>
    </>
  );
}