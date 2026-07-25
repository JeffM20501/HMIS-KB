import { Outlet } from 'react-router-dom';
import PublicHeader from '../components/layout/PublicHeader.jsx';
import PublicFooter from '../components/layout/PublicFooter.jsx';
import ChatWidget from '../components/chatbot/ChatWidget.jsx';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      <ChatWidget context={{ module: 'public_kb' }} />
    </div>
  );
}
