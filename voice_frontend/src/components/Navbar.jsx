import { Link, useLocation } from 'react-router-dom';

const links = [
  { label: 'Home', to: '/' },
  { label: 'Session', to: '/session/eva' },
  { label: 'Journey', to: '/journey' },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: '#FFFFFF', borderBottom: '1px solid #EAEAF0',
      height: 60,
    }}>
      <div style={{
        maxWidth: 1000, margin: '0 auto', padding: '0 24px',
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#5B21B6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>
            🔬
          </div>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, color: '#111118' }}>
            Voice<span style={{ color: '#5B21B6' }}>Verse</span>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {links.map(({ label, to }) => {
            const active = pathname === to || (to === '/session/eva' && pathname.startsWith('/session'));
            return (
              <Link key={label} to={to} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                color: active ? '#5B21B6' : '#6B7280',
                background: active ? '#F0EBFF' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}>
                {label}
              </Link>
            );
          })}
        </div>

        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: 'linear-gradient(135deg, #5B21B6, #7C3AED)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: 'white',
          fontFamily: 'Space Grotesk, sans-serif',
        }}>
          K
        </div>
      </div>
    </nav>
  );
}
