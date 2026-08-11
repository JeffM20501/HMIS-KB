import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar.jsx';
import Topbar from '../components/layout/Topbar.jsx';
import ChatWidget from '../components/chatbot/ChatWidget.jsx';

export default function DashboardLayout({ navItems, badges, notificationsRoute, currentModule }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar
        items={navItems}
        badges={badges}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          notificationsRoute={notificationsRoute}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      <ChatWidget context={{ module: currentModule }} />
    </div>
  );
}