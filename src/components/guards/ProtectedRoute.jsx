import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, initializing } = useAuth();

  // Wait for token verification before making any decision
  if (initializing) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary, #0f0f17)',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 44, height: 44,
          borderRadius: '50%',
          border: '3px solid rgba(112,48,224,0.2)',
          borderTopColor: '#7030e0',
          animation: 'spin 0.9s linear infinite',
        }} />
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>Loading EduStream...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role → redirect to own dashboard
  if (roles && !roles.includes(user.role)) {
    const redirectMap = { student: '/dashboard', mentor: '/mentor', admin: '/admin' };
    return <Navigate to={redirectMap[user.role] || '/dashboard'} replace />;
  }

  return children;
}
