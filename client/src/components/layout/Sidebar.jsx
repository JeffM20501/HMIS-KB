import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { LogOut } from 'lucide-react';
import Logo from '../common/Logo.jsx';
import Avatar from '../ui/Avatar.jsx';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar({ items, badges = {} }) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-white border-r border-border flex flex-col">
      <div className="h-16 flex items-center px-5 border-b border-border">
        <Logo to="/" />
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {items.map((item) => {
          const badge = item.badgeKey ? badges[item.badgeKey] : null;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-colors focus-ring',
                  isActive ? 'bg-primary-50 text-primary' : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                )
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span className="flex-1">{item.label}</span>
              {!!badge && (
                <span className="text-xs font-semibold bg-primary-50 text-primary rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border flex items-center gap-2.5">
        <Avatar name={user?.full_name || user?.email} src={user?.avatar} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary truncate">{user?.full_name || user?.email}</p>
          <p className="text-xs text-text-secondary capitalize">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="p-1.5 text-text-secondary hover:text-danger hover:bg-danger-bg rounded focus-ring"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
