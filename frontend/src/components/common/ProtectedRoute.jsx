import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useSelector(s => s.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={user?.role === 'superadmin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const { isAuthenticated, user } = useSelector(s => s.auth);
  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'superadmin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }
  return children;
}
