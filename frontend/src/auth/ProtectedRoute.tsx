import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface Props {
  children: React.ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && role && !roles.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
