import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wrap any route with this component to require authentication.
 * Unauthenticated users are redirected to /login with the original
 * path saved so they can be sent back after login.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F7F7F8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          {/* Spinner */}
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '3px solid #DDD6FE',
            borderTopColor: '#5B21B6',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#6B7280', fontSize: 14, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 500 }}>
            Loading…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
