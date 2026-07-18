// src/components/layout/Topbar.jsx
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, ChevronRight, Menu, BellOff, Clock, Check, X } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { listNotifications, markNotificationRead } from "../../api/analytics";

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
      // revert on error
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
    }
  };

  // Click outside to close dropdown
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
        {/* Notifications dropdown */}
        <div className="relative" ref={dropdownRef}>
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

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-80 bg-white rounded-lg border shadow-lg z-50 overflow-hidden"
              style={{ borderColor: "#E1E3EA" }}
            >
              <div className="p-3 border-b" style={{ borderColor: "#F4F4F6" }}>
                <p className="text-sm font-semibold" style={{ color: "#121C2D" }}>Notifications</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifLoading ? (
                  <div className="py-6 text-center text-sm" style={{ color: "#9EA6B3" }}>
                    Loading...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-6 text-center text-sm" style={{ color: "#9EA6B3" }}>
                    <BellOff size={18} className="mx-auto mb-2" style={{ color: "#D1D5DB" }} />
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      
                      onClick={() => !n.read && handleMarkRead(n.id)}
                      className="flex items-start gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors border-b last:border-0"
                      style={{
                        borderColor: "#F4F4F6",
                        background: n.read ? "white" : "#FDEEF0",
                      }}
                    >
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#F22F46" }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs" style={{ color: "#121C2D" }}>{n.message ?? n.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#9EA6B3" }}>
                          <Clock size={10} className="inline mr-1" />
                          {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
                        </p>
                      </div>
                      {n.read && <Check size={12} style={{ color: "#00A368", flexShrink: 0 }} />}
                    </button>
                  ))
                )}
              </div>
              <div className="p-2 border-t" style={{ borderColor: "#F4F4F6" }}>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate("/app/settings?tab=notifications");
                  }}
                  className="w-full py-1.5 text-xs font-medium text-center hover:underline"
                  style={{ color: "#F22F46" }}
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar button */}
        <button
          onClick={() => navigate("/app/settings")}
          className="flex items-center justify-center rounded-full text-xs font-bold cursor-pointer"
          style={{ width: 30, height: 30, background: "#F22F46", color: "white" }}
          title={user?.name}
        >
          {user?.avatar ?? (user?.name ? user.name.slice(0, 2).toUpperCase() : "?")}
        </button>
      </div>
    </header>
  );
}