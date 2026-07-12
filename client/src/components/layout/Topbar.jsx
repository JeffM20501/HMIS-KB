import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, ChevronRight, Menu } from "lucide-react";
import useAuth from "../../hooks/useAuth";

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

  const segment = location.pathname.split("/").filter(Boolean)[1] ?? "dashboard";
  const title = pageTitles[segment] ?? segment.replace(/-/g, " ");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/app/knowledge-base?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

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
        <span style={{ color: "#121C2D" }} className="font-medium capitalize">{title}</span>
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
        <button className="relative p-2 rounded-md hover:bg-gray-100 transition-colors" title="Notifications">
          <Bell size={17} style={{ color: "#696E7A" }} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "#F22F46" }} />
        </button>
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
