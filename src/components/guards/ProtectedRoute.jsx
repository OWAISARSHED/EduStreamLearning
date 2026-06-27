import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const redirectMap = {
      student: '/dashboard',
      mentor: '/mentor',
      admin: '/admin',
    };
    return <Navigate to={redirectMap[user.role] || '/dashboard'} replace />;
  }

  return children;
}
