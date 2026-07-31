import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageLoader from '../components/common/PageLoader';

/**
 * Gate a route subtree to a set of allowed roles.
 * Usage: <RoleRoute allowed={['admin']} />
 */
export default function RoleRoute({ allowed = [] }) {
  const { user, isLoading, hasRole } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  if (!hasRole(...allowed)) {
    // Send a demoted/mismatched role somewhere sensible rather than a bare 403.
    const fallback = user.role === 'admin' ? '/admin' : user.role === 'editor' ? '/editor' : '/';
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
