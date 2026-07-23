import { useState } from "react";
import { Outlet } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import KBAssistant from "../assistant/KBAssistant.jsx";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--font-inter)" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto" style={{ background: "#F4F4F6" }}>
          <Outlet />
        </main>
      </div>

      {/* Floating KB Assistant — embeddable widget pattern (FR-5.1) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {showAssistant && <KBAssistant onClose={() => setShowAssistant(false)} />}
        <button
          onClick={() => setShowAssistant((v) => !v)}
          className="flex items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{ width: 52, height: 52, background: "#F22F46" }}
          title="KB Assistant"
        >
          <MessageCircle size={22} color="white" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
