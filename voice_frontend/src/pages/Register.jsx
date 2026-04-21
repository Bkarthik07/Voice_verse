import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AVATAR_COLORS = [
  '#5B21B6', '#7C3AED', '#DB2777', '#0EA5E9',
  '#059669', '#D97706', '#DC2626', '#0D9488',
];

function StrengthBar({ password }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/]
    .filter((r) => r.test(password)).length;
  const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  return password.length > 0 ? (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[0,1,2,3].map((i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < score ? colors[score - 1] : '#EAEAF0',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: score > 0 ? colors[score - 1] : 'transparent', fontWeight: 600 }}>
        {score > 0 ? labels[score - 1] : ''}
      </p>
    </div>
  ) : null;
}

export default function Register() {
  const [username,  setUsername]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [color,     setColor]     = useState('#5B21B6');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  const { register } = useAuth();
  const navigate     = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await register(username, email, password, color);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 12, boxSizing: 'border-box',
    background: '#F7F7F8', border: '1.5px solid #EAEAF0',
    color: '#111118', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.2s, background 0.2s',
  };
  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: '#6B7280', marginBottom: 6, letterSpacing: '0.05em',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F7F8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', padding: '24px',
      paddingTop: 84,
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'fixed', top: '-80px', right: '-80px', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, #DDD6FE, transparent)', opacity: 0.6, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-60px', left: '-60px', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, #EDE9FE, transparent)', opacity: 0.5, pointerEvents: 'none' }} />

      {/* Card */}
      <div className="card animate-slide-up" style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 440,
        borderRadius: 20, padding: '40px 36px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 16, marginBottom: 16,
            background: 'linear-gradient(135deg, #5B21B6, #7C3AED)',
            fontSize: 28, boxShadow: '0 8px 24px rgba(91,33,182,0.25)',
          }}>🔬</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111118', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 6 }}>
            Create your account
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280' }}>
            Join VoiceVerse and start learning with Eva
          </p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#DC2626', fontSize: 13, fontWeight: 500 }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Avatar color */}
          <div>
            <label style={labelStyle}>AVATAR COLOR</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {AVATAR_COLORS.map((c) => (
                <div key={c} onClick={() => setColor(c)} style={{
                  width: 28, height: 28, borderRadius: 8, background: c,
                  cursor: 'pointer',
                  border: color === c ? `2.5px solid #5B21B6` : '2.5px solid transparent',
                  boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}80` : 'none',
                  transition: 'all 0.2s', flexShrink: 0,
                }} />
              ))}
              {/* Preview */}
              <div style={{
                width: 36, height: 28, borderRadius: 8, background: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 13, fontWeight: 800,
                fontFamily: 'Space Grotesk, sans-serif', marginLeft: 4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}>
                {username ? username[0].toUpperCase() : 'A'}
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <label style={labelStyle}>USERNAME</label>
            <input id="reg-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              required placeholder="Karthik" style={fieldStyle}
              onFocus={(e) => { e.target.style.borderColor = '#5B21B6'; e.target.style.background = '#FFFFFF'; }}
              onBlur={(e)  => { e.target.style.borderColor = '#EAEAF0'; e.target.style.background = '#F7F7F8'; }} />
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>EMAIL</label>
            <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required placeholder="you@example.com" style={fieldStyle}
              onFocus={(e) => { e.target.style.borderColor = '#5B21B6'; e.target.style.background = '#FFFFFF'; }}
              onBlur={(e)  => { e.target.style.borderColor = '#EAEAF0'; e.target.style.background = '#F7F7F8'; }} />
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>PASSWORD</label>
            <input id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required placeholder="Min. 8 characters" style={fieldStyle}
              onFocus={(e) => { e.target.style.borderColor = '#5B21B6'; e.target.style.background = '#FFFFFF'; }}
              onBlur={(e)  => { e.target.style.borderColor = '#EAEAF0'; e.target.style.background = '#F7F7F8'; }} />
            <StrengthBar password={password} />
          </div>

          {/* Confirm */}
          <div>
            <label style={labelStyle}>CONFIRM PASSWORD</label>
            <input id="reg-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              required placeholder="Repeat password"
              style={{
                ...fieldStyle,
                borderColor: confirm && confirm !== password ? 'rgba(239,68,68,0.5)' : '#EAEAF0',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#5B21B6'; e.target.style.background = '#FFFFFF'; }}
              onBlur={(e)  => { e.target.style.borderColor = confirm && confirm !== password ? 'rgba(239,68,68,0.5)' : '#EAEAF0'; e.target.style.background = '#F7F7F8'; }} />
            {confirm && confirm !== password && (
              <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4, fontWeight: 500 }}>Passwords don't match</p>
            )}
          </div>

          <button id="reg-submit" type="submit" disabled={loading} style={{
            marginTop: 4, padding: '13px', borderRadius: 12, border: 'none',
            background: loading ? 'rgba(91,33,182,0.4)' : '#5B21B6',
            color: 'white', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.04em',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(91,33,182,0.25)', transition: 'all 0.25s',
          }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = '#4C1D95'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
            onMouseLeave={(e) => { e.currentTarget.style.background = loading ? 'rgba(91,33,182,0.4)' : '#5B21B6'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 0' }}>
          <div style={{ flex: 1, height: 1, background: '#EAEAF0' }} />
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#EAEAF0' }} />
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6B7280' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#5B21B6', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
