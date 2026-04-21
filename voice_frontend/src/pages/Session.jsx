import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVoiceSession } from '../hooks/useVoiceSession';
import api from '../api/client';

/* ── Status config ─────────────────────────────────────────────────── */
const STATUS = {
  idle:       { label: 'Not connected', color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  connecting: { label: 'Connecting…',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  connected:  { label: 'Ready',         color: '#10B981', bg: 'rgba(16,185,129,0.12)'  },
  listening:  { label: 'Listening…',    color: '#5B21B6', bg: 'rgba(167,139,250,0.12)' },
  processing: { label: 'Processing…',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  playing:    { label: 'Speaking…',     color: '#38BDF8', bg: 'rgba(56,189,248,0.12)'  },
  error:      { label: 'Error',         color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
};

/* ── Animated waveform ─────────────────────────────────────────────── */
function Waveform({ active, color = '#A78BFA' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 32 }}>
      {[0.35, 0.6, 1, 0.75, 0.9, 0.5, 0.8, 0.4, 0.65, 0.95, 0.55].map((h, i) => (
        <div key={i} className="wave-bar" style={{
          height: active ? 32 * h : 4,
          background: active ? color : 'transparent',
          animation: active ? `wave-bar ${0.55 + i * 0.07}s ease-in-out infinite alternate` : 'none',
          animationDelay: `${i * 0.05}s`,
          transition: 'height 0.3s, background 0.3s',
        }} />
      ))}
    </div>
  );
}

/* ── Timer ─────────────────────────────────────────────────────────── */
function Timer({ running }) {
  const [sec, setSec] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (running) { ref.current = setInterval(() => setSec((s) => s + 1), 1000); }
    else { clearInterval(ref.current); setSec(0); }
    return () => clearInterval(ref.current);
  }, [running]);
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return (
    <span style={{
      fontSize: 12, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif',
      color: running ? '#EF4444' : '#6B7280',
      padding: '4px 10px', borderRadius: 20,
      background: running ? 'rgba(239,68,68,0.1)' : '#FFFFFF',
      border: `1px solid ${running ? 'rgba(239,68,68,0.3)' : '#EAEAF0'}`,
      letterSpacing: '0.05em',
    }}>
      {running && <span style={{ marginRight: 5, animation: 'pulse-dot 1.2s ease-in-out infinite' }}>●</span>}
      {fmt(sec)}
    </span>
  );
}

/* ── Mic SVG ───────────────────────────────────────────────────────── */
function MicIcon({ muted, size = 24 }) {
  return muted ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

/* ── Background ambient orbs ───────────────────────────────────────── */
function AmbientOrbs({ active }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {[
        { s: 200, x: '12%',  y: '18%', d: '0s',   dr: '7s'  },
        { s: 140, x: '72%',  y: '58%', d: '1.2s', dr: '9s'  },
        { s: 90,  x: '48%',  y: '22%', d: '2s',   dr: '6s'  },
        { s: 70,  x: '22%',  y: '72%', d: '0.6s', dr: '5s'  },
        { s: 110, x: '85%',  y: '28%', d: '1.8s', dr: '8s'  },
      ].map((o, i) => (
        <div key={i} style={{
          position: 'absolute', width: o.s, height: o.s, borderRadius: '50%',
          left: o.x, top: o.y, transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, #7C3AED, transparent)',
          opacity: active ? 0.1 : 0,
          animation: active ? `float ${o.dr} ease-in-out ${o.d} infinite alternate` : 'none',
          transition: 'opacity 1.2s',
        }} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Session Page
═══════════════════════════════════════════════════════════════════════ */
export default function Session() {
  const { user, getToken }       = useAuth();
  const navigate                 = useNavigate();
  const { status, isConnected, isMicOn, connect, disconnect, startRecording, stopRecording, toggleMic } = useVoiceSession();

  const [sessionStarted, setSessionStarted] = useState(false);
  const [isRecording,    setIsRecording]    = useState(false);
  const [voiceSessionId, setVoiceSessionId] = useState(null);  // UUID from /sessions/start
  const [apiError,       setApiError]       = useState('');

  // Keep a ref so cleanup effect always sees the latest session ID
  const sessionIdRef = useRef(null);
  useEffect(() => { sessionIdRef.current = voiceSessionId; }, [voiceSessionId]);

  const sc          = STATUS[status] || STATUS.idle;
  const isActive    = sessionStarted && isConnected;
  const isSpeaking  = status === 'playing';
  const isListening = status === 'listening';

  /* ── Auto-save session on unmount / tab close ──────────────────── */
  useEffect(() => {
    const saveSession = () => {
      const sid = sessionIdRef.current;
      if (!sid) return;
      // Use sendBeacon for tab-close (fire-and-forget)
      const token = getToken();
      if (navigator.sendBeacon) {
        const blob = new Blob([], { type: 'application/json' });
        navigator.sendBeacon(`http://localhost:8000/sessions/${sid}/end`, blob);
      }
    };

    window.addEventListener('beforeunload', saveSession);
    return () => {
      window.removeEventListener('beforeunload', saveSession);
      // Also save when navigating away within the SPA
      const sid = sessionIdRef.current;
      if (sid) {
        api.patch(`/sessions/${sid}/end`).catch(() => {});
      }
    };
  }, []);  // eslint-disable-line

  /* ── Start session ─────────────────────────────────────────────── */
  const handleStart = async () => {
    setApiError('');
    try {
      const { data } = await api.post('/sessions/start');
      setVoiceSessionId(data.session_id);
      connect({ token: getToken(), sessionId: data.session_id });
      setSessionStarted(true);
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Failed to start session.');
    }
  };

  /* ── End session ───────────────────────────────────────────────── */
  const handleEnd = async () => {
    if (isRecording) { stopRecording(); setIsRecording(false); }
    disconnect();
    setSessionStarted(false);
    if (voiceSessionId) {
      try { await api.patch(`/sessions/${voiceSessionId}/end`); }
      catch { /* best-effort */ }
      setVoiceSessionId(null);
    }
  };

  /* ── Talk toggle ───────────────────────────────────────────────── */
  const handleTalk = async () => {
    if (!isConnected) return;
    if (isRecording) { stopRecording(); setIsRecording(false); }
    else             { await startRecording(); setIsRecording(true); }
  };

  /* ── Action bar config ─────────────────────────────────────────── */
  const action = !sessionStarted
    ? { label: '🚀  Start Session',    fn: handleStart, grad: 'linear-gradient(135deg, #5B21B6, #7C3AED)', shadow: '0 8px 32px rgba(91,33,182,0.45)' }
    : !isConnected
    ? { label: '⏳  Connecting…',      fn: null,        grad: 'linear-gradient(135deg, #1F2937, #374151)', shadow: 'none' }
    : isRecording
    ? { label: '⏹  Stop Talking',     fn: handleTalk,  grad: 'linear-gradient(135deg, #DC2626, #EF4444)', shadow: '0 8px 32px rgba(239,68,68,0.4)' }
    : { label: '🎤  Start Talking',    fn: handleTalk,  grad: 'linear-gradient(135deg, #5B21B6, #7C3AED)', shadow: '0 8px 32px rgba(91,33,182,0.45)' };

  const userInitial = user?.username?.[0]?.toUpperCase() ?? '?';

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F8', paddingTop: 60, fontFamily: 'Inter, sans-serif' }}>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/" style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}>
            ← Home
          </Link>
          <span style={{ color: 'transparent' }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111118', fontFamily: 'Space Grotesk, sans-serif' }}>
            Session with Eva
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 20, background: sc.bg,
            border: `1px solid ${sc.color}30`, transition: 'all 0.4s',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: sc.color, display: 'inline-block',
              boxShadow: `0 0 8px ${sc.color}`,
              animation: (isListening || isSpeaking) ? 'pulse-dot 1s ease-in-out infinite' : 'none',
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: sc.color }}>{sc.label}</span>
          </div>
          <Timer running={isRecording} />
        </div>
      </div>

      {apiError && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 12px' }}>
          <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171', fontSize: 13 }}>
            ⚠️ {apiError}
          </div>
        </div>
      )}

      {/* ── Main grid ───────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 20px', display: 'grid', gridTemplateColumns: '1fr 300px', gridTemplateRows: 'auto auto', gap: 16 }}>

        {/* ── LEFT — Eva main panel ── */}
        <div style={{
          gridRow: '1 / 3', position: 'relative', borderRadius: 20, overflow: 'hidden',
          background: '#FFFFFF',
          border: `1.5px solid ${isActive ? '#D4C3F8' : '#EAEAF0'}`,
          boxShadow: isActive ? '0 6px 24px rgba(91,33,182,0.12)' : '0 4px 20px rgba(0,0,0,0.03)',
          transition: 'all 0.5s', minHeight: 420,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        }}>
          <AmbientOrbs active={isActive} />

          {/* Eva avatar */}
          <div style={{ position: 'relative', marginBottom: 24, zIndex: 1 }}>
            {isSpeaking && (
              <div style={{ position: 'absolute', inset: -18, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.18), transparent)', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
            )}
            <div style={{
              width: 120, height: 120, borderRadius: 28,
              background: isActive ? 'linear-gradient(135deg, #5B21B6, #7C3AED)' : 'linear-gradient(135deg, #7C3AED, #A78BFA)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54,
              boxShadow: isActive ? '0 16px 48px rgba(91,33,182,0.3), 0 0 0 1px rgba(124,58,237,0.2)' : '0 8px 24px rgba(91,33,182,0.2)',
              transition: 'all 0.5s', animation: isActive ? 'float 4s ease-in-out infinite' : 'none',
            }}>🔬</div>
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: '#111118', marginBottom: 6, zIndex: 1 }}>Eva</h2>
          <p style={{ fontSize: 13, color: '#6B7280', fontWeight: 500, zIndex: 1, marginBottom: 24, fontFamily: 'Inter, sans-serif' }}>General Science AI Companion</p>

          {(isListening || isSpeaking) ? (
            <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <Waveform active={true} color={isSpeaking ? '#38BDF8' : '#A78BFA'} />
              <span style={{ fontSize: 12, color: isSpeaking ? '#38BDF8' : '#A78BFA', fontWeight: 500 }}>
                {isSpeaking ? 'Eva is speaking…' : 'Listening to you…'}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 340, zIndex: 1 }}>
              {['Physics', 'Chemistry', 'Biology', 'Astronomy', 'Math', 'Earth Science'].map((t) => (
                <span key={t} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: '#F0EBFF', color: '#5B21B6', border: '1px solid #DDD6FE' }}>{t}</span>
              ))}
            </div>
          )}

          <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 1 }}>
            <p style={{ fontSize: 12, color: '#6B7280', background: '#F0EBFF', padding: '6px 16px', borderRadius: 20, border: '1px solid #DDD6FE', fontWeight: 500 }}>
              {!sessionStarted && '💡 Click Start Session to connect'}
              {sessionStarted && !isConnected && '⏳ Establishing connection…'}
              {isConnected && !isRecording && '🎤 Press Start Talking to ask a question'}
              {isRecording && '⏹ Press Stop when done speaking'}
            </p>
          </div>
        </div>

        {/* ── RIGHT TOP — User tile ── */}
        <div style={{
          borderRadius: 20, background: '#FFFFFF',
          border: '1.5px solid #EAEAF0', padding: '28px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 10, minHeight: 180, boxSizing: 'border-box',
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              background: user?.avatar_color || 'linear-gradient(135deg, #5B21B6, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, color: 'white',
              fontFamily: 'Space Grotesk, sans-serif',
              boxShadow: `0 8px 28px ${(user?.avatar_color || '#5B21B6')}60`,
            }}>
              {userInitial}
            </div>
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 14, height: 14, borderRadius: '50%',
              background: isConnected ? '#10B981' : '#D1D5DB',
              border: '2.5px solid #FFFFFF',
              transition: 'background 0.4s, box-shadow 0.4s',
              boxShadow: isConnected ? '0 0 8px rgba(16,185,129,0.5)' : 'none',
            }} />
          </div>
          <p style={{ fontWeight: 700, fontSize: 16, color: '#111118', fontFamily: 'Space Grotesk, sans-serif', marginTop: 4 }}>
            {user?.username ?? 'User'}
          </p>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
            background: isConnected ? 'rgba(16,185,129,0.1)' : '#F3F4F6',
            color: isConnected ? '#10B981' : '#9CA3AF',
            border: `1px solid ${isConnected ? 'rgba(16,185,129,0.25)' : '#E5E7EB'}`,
          }}>
            {isConnected ? '● Connected' : 'Offline'}
          </span>
        </div>

        {/* ── RIGHT BOTTOM — Mic tile ── */}
        <div
          onClick={toggleMic}
          style={{
            borderRadius: 20, background: '#FFFFFF',
            border: `1.5px solid ${isMicOn ? '#EAEAF0' : 'rgba(239,68,68,0.3)'}`,
            padding: '24px 20px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
            cursor: 'pointer', userSelect: 'none', minHeight: 130, boxSizing: 'border-box',
            transition: 'all 0.25s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = isMicOn ? '#D4C3F8' : 'rgba(239,68,68,0.5)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = isMicOn ? '#EAEAF0' : 'rgba(239,68,68,0.3)'}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: isMicOn ? 'rgba(124,58,237,0.15)' : 'rgba(239,68,68,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isMicOn ? '#A78BFA' : '#EF4444', transition: 'all 0.25s',
          }}>
            <MicIcon muted={!isMicOn} size={24} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: isMicOn ? '#111118' : '#EF4444', transition: 'color 0.25s' }}>
            {isMicOn ? 'Microphone on' : 'Microphone off'}
          </p>
        </div>
      </div>

      {/* ── Bottom action bar ────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 40px', display: 'flex', gap: 12, alignItems: 'center' }}>

        {/* Primary action */}
        <button onClick={action.fn || undefined} disabled={!action.fn} style={{
          flex: 1, padding: '15px 24px', borderRadius: 14, border: 'none',
          background: action.grad, color: 'white', fontSize: 14, fontWeight: 700,
          cursor: action.fn ? 'pointer' : 'default', fontFamily: 'Space Grotesk, sans-serif',
          letterSpacing: '0.04em', boxShadow: action.shadow, transition: 'all 0.3s',
          opacity: !action.fn ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
          onMouseEnter={(e) => { if (action.fn) e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {action.label}
          {isRecording && <span style={{ animation: 'pulse-dot 1s ease-in-out infinite', fontSize: 10 }}>●</span>}
        </button>

        {/* End session */}
        {sessionStarted && (
          <button onClick={handleEnd} style={{
            padding: '15px 20px', borderRadius: 14, background: 'rgba(239,68,68,0.12)',
            color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: '1.5px solid rgba(239,68,68,0.25)', fontFamily: 'Space Grotesk, sans-serif',
            transition: 'all 0.25s', whiteSpace: 'nowrap',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
          >
            ✕ End Session
          </button>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', borderRadius: 14, overflow: 'hidden', border: '1.5px solid #EAEAF0', background: '#FFFFFF' }}>
          {[{ v: '4.9', l: 'Rating' }, { v: '41K', l: 'Sessions' }, { v: '<1s', l: 'Response' }].map(({ v, l }, i) => (
            <div key={l} style={{ padding: '10px 18px', textAlign: 'center', borderRight: i < 2 ? '1px solid #EAEAF0' : 'none' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#5B21B6', fontFamily: 'Space Grotesk, sans-serif' }}>{v}</p>
              <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1, fontWeight: 500 }}>{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
