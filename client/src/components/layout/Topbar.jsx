// src/components/layout/Topbar.jsx
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, ChevronRight, Menu, BellOff, Clock, Check, X } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { listNotifications, markNotificationRead } from "../../api/analytics";
import { isAvatarUrl } from "../../utils/normalize"; // ✅ import

const pageTitles = {
  dashboard: "Dashboard",
  "knowledge-base": "Knowledge Base",
  admin: "Admin Panel",
  settings: "Settings",
  articles: "Article",
};

export default function Topbar({ onOpenSidebar }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchVal, setSearchVal] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const dropdownRef = useRef(null);

  const segment = location.pathname.split("/").filter(Boolean)[1] ?? "dashboard";
  const title = pageTitles[segment] ?? segment.replace(/-/g, " ");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/app/knowledge-base?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const toggleNotifications = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setNotifLoading(true);
      try {
        const data = await listNotifications({ page_size: 5 });
        setNotifications(data.results ?? data ?? []);
      } catch (err) {
        // ignore
      } finally {
        setNotifLoading(false);
      }
    }
  };

  const handleMarkRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await markNotificationRead(id);
    } catch (err) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ✅ Avatar: either URL or initials (already normalized)
  const avatarDisplay = user?.avatar || "?";
  const isUrl = isAvatarUrl(avatarDisplay);

  return (
    <header
      className="flex-shrink-0 flex items-center gap-4 px-6 py-3 border-b bg-white"
      style={{ borderColor: "#E8E8EC" }}
    >
      <button className="lg:hidden p-1 rounded" onClick={onOpenSidebar} style={{ color: "#696E7A" }}>
        <Menu size={20} />
      </button>

      <div className="hidden sm:flex items-center gap-1.5 text-sm flex-shrink-0">
        <span style={{ color: "#696E7A" }}>HMIS</span>
        <ChevronRight size={14} style={{ color: "#9EA6B3" }} />
        <span style={{ color: "#121C2D" }} className="font-medium capitalize">
          {title}
        </span>
      </div>

      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "#9EA6B3" }}
          />
          <input
            type="text"
            placeholder="Search knowledge base…"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border outline-none transition-all"
            style={{ borderColor: "#E1E3EA", background: "#F9FAFB", color: "#121C2D", fontSize: 13 }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#F22F46";
              e.currentTarget.style.background = "white";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#E1E3EA";
              e.currentTarget.style.background = "#F9FAFB";
            }}
          />
        </div>
      </form>

      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
        {/* Notifications dropdown (unchanged) */}
        <div className="relative" ref={dropdownRef}>
          {/* ... notifications button and dropdown ... */}
          <button
            className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
            onClick={toggleNotifications}
            title="Notifications"
          >
            <Bell size={17} style={{ color: "#696E7A" }} />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{ background: "#F22F46" }}
              />
            )}
          </button>
          {/* ... dropdown content ... */}
        </div>

        {/* User avatar button */}
        <button
          onClick={() => navigate("/app/settings")}
          className="flex items-center justify-center rounded-full text-xs font-bold cursor-pointer overflow-hidden flex-shrink-0"
          style={{ width: 30, height: 30, background: "#F22F46", color: "white" }}
          title={user?.name}
        >
          {isUrl ? (
            <img src={avatarDisplay} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            avatarDisplay
          )}
        </button>
      </div>
    </header>
  );
}