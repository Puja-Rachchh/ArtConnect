import { Navigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, role } = useRole();

  // If not authenticated, redirect to landing page
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // If user's actual role doesn't match the required role, redirect appropriately
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to the correct dashboard based on user's actual role
    const redirectPath = user.role === 'artist' ? '/artist/dashboard' : '/buyer/marketplace';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;