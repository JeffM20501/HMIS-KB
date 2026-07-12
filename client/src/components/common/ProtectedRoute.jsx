import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Spinner from "./Spinner.jsx";

/**
 * Gate for any route under /app/*. Waits for the initial session check to
 * finish before deciding, so a hard refresh doesn't flash the login screen.
 * `roles` (optional) restricts the route to specific user roles (e.g. admin-only).
 */
export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, initializing, user } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#F4F4F6" }}>
        <Spinner label="Loading HealthKB…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}
