import { Outlet } from 'react-router-dom';
import Logo from '../components/common/Logo.jsx';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo className="mb-8 justify-center" />
          <Outlet />
        </div>
      </div>
      <div className="hidden lg:flex flex-1 bg-primary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_60%,white,transparent_35%)]" />
        <div className="relative text-white max-w-md px-10 text-center">
          <h2 className="text-3xl font-bold mb-3">The single source of truth for TaifaCare HMIS</h2>
          <p className="text-primary-100 text-white/80">
            SOPs, how-to guides, and troubleshooting documentation — searchable, versioned, and auditable
            across every clinical module.
          </p>
        </div>
      </div>
    </div>
  );
}
