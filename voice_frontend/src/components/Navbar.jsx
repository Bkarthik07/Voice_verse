import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { label: 'Home',    to: '/' },
  { label: 'Session', to: '/session/eva' },
  { label: 'Journey', to: '/journey' },
];

export default function Navbar() {
  const { pathname }          = useLocation();
  const { user, logout }      = useAuth();
  const navigate              = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: '#FFFFFF', borderBottom: '1px solid #EAEAF0',
      height: 60,
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 24px',
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#5B21B6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>🔬</div>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, color: '#111118' }}>
            Voice<span style={{ color: '#5B21B6' }}>Verse</span>
          </span>
        </Link>

        {/* Nav links — only when authenticated */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {NAV_LINKS.map(({ label, to }) => {
              const active = pathname === to || (to === '/session/eva' && pathname.startsWith('/session'));
              return (
                <Link key={label} to={to} style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                  color: active ? '#5B21B6' : '#6B7280',
                  background: active ? '#F0EBFF' : 'transparent',
                  textDecoration: 'none', transition: 'all 0.2s',
                }}>
                  {label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <>
              {/* Profile link */}
              <Link to="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: user.avatar_color || 'linear-gradient(135deg, #5B21B6, #7C3AED)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: 'white',
                  fontFamily: 'Space Grotesk, sans-serif',
                  boxShadow: `0 2px 8px ${user.avatar_color || '#5B21B6'}40`,
                  border: pathname === '/profile' ? '2px solid #5B21B6' : '2px solid transparent',
                  transition: 'border-color 0.2s',
                }}>
                  {user.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 600, color: '#374151',
                  display: pathname === '/profile' ? 'block' : 'none',
                }}>
                  {user.username}
                </span>
              </Link>

              {/* Logout */}
              <button onClick={handleLogout} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'transparent', border: '1px solid #E5E7EB',
                color: '#6B7280', cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FCA5A5'; e.currentTarget.style.color = '#EF4444'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                color: '#6B7280', textDecoration: 'none', transition: 'color 0.2s',
              }}>
                Sign in
              </Link>
              <Link to="/register" style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: '#5B21B6', color: 'white', textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(91,33,182,0.25)', transition: 'all 0.2s',
              }}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
