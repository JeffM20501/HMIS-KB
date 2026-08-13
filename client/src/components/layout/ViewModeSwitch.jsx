import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ROUTES } from '../../constants/routes';

/**
 * Lets an authenticated Admin switch between the Admin and Editor
 * experiences without changing their underlying role.
 *
 * This is purely a navigation shortcut between the already-permitted
 * "/admin" and "/editor" route trees (see RoleRoute — Admins are allowed
 * on both). The active segment reflects whichever layout is currently
 * mounted, so the "view" is derived from the URL and naturally survives
 * navigation and page refreshes.
 *
 * Only rendered for Admins — Editors never see this control.
 */
export default function ViewModeSwitch({ currentModule }) {
  const navigate = useNavigate();

  const options = [
    { value: 'admin', label: 'Admin', to: ROUTES.ADMIN_DASHBOARD },
    { value: 'editor', label: 'Editor', to: ROUTES.EDITOR_DASHBOARD },
  ];

  return (
    <div
      role="tablist"
      aria-label="Switch view"
      className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-lg bg-gray-50 border border-border"
    >
      {options.map((opt) => {
        const isActive = currentModule === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => !isActive && navigate(opt.to)}
            className={clsx(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-ring',
              isActive
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
