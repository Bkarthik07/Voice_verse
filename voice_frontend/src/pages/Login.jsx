import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 12, boxSizing: 'border-box',
    background: '#F7F7F8', border: '1.5px solid #EAEAF0',
    color: '#111118', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F7F8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', padding: '24px',
      paddingTop: 84,
    }}>
      {/* Subtle top-right decorative blob */}
      <div style={{ position: 'fixed', top: '-80px', right: '-80px', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, #DDD6FE, transparent)', opacity: 0.6, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-60px', left: '-60px', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, #EDE9FE, transparent)', opacity: 0.5, pointerEvents: 'none' }} />

      {/* Card */}
      <div className="card animate-slide-up" style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 420,
        borderRadius: 20, padding: '40px 36px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 16, marginBottom: 16,
            background: 'linear-gradient(135deg, #5B21B6, #7C3AED)',
            fontSize: 28, boxShadow: '0 8px 24px rgba(91,33,182,0.25)',
          }}>🔬</div>
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: '#111118',
            fontFamily: 'Space Grotesk, sans-serif', marginBottom: 6,
          }}>Welcome back</h1>
          <p style={{ fontSize: 13, color: '#6B7280', fontWeight: 400 }}>
            Sign in to continue with Eva
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 20,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#DC2626', fontSize: 13, fontWeight: 500,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6, letterSpacing: '0.05em' }}>
              EMAIL
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={fieldStyle}
              onFocus={(e) => { e.target.style.borderColor = '#5B21B6'; e.target.style.background = '#FFFFFF'; }}
              onBlur={(e)  => { e.target.style.borderColor = '#EAEAF0'; e.target.style.background = '#F7F7F8'; }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6, letterSpacing: '0.05em' }}>
              PASSWORD
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={fieldStyle}
              onFocus={(e) => { e.target.style.borderColor = '#5B21B6'; e.target.style.background = '#FFFFFF'; }}
              onBlur={(e)  => { e.target.style.borderColor = '#EAEAF0'; e.target.style.background = '#F7F7F8'; }}
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8, padding: '13px', borderRadius: 12, border: 'none',
              background: loading ? 'rgba(91,33,182,0.4)' : '#5B21B6',
              color: 'white', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.04em',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(91,33,182,0.25)',
              transition: 'all 0.25s',
            }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = '#4C1D95'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
            onMouseLeave={(e) => { e.currentTarget.style.background = loading ? 'rgba(91,33,182,0.4)' : '#5B21B6'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 0' }}>
          <div style={{ flex: 1, height: 1, background: '#EAEAF0' }} />
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#EAEAF0' }} />
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6B7280' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#5B21B6', fontWeight: 600, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
