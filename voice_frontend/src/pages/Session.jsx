import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useVoiceSession } from '../hooks/useVoiceSession';

const STATUS = {
  idle:       { label: 'Not connected',  color: '#9CA3AF', bg: '#F9FAFB' },
  connecting: { label: 'Connecting…',    color: '#F59E0B', bg: '#FFFBEB' },
  connected:  { label: 'Ready',          color: '#10B981', bg: '#F0FDF4' },
  listening:  { label: 'Listening…',     color: '#5B21B6', bg: '#F5F3FF' },
  processing: { label: 'Processing…',    color: '#F59E0B', bg: '#FFFBEB' },
  playing:    { label: 'Speaking…',      color: '#0EA5E9', bg: '#F0F9FF' },
  error:      { label: 'Error',          color: '#EF4444', bg: '#FEF2F2' },
};

function Waveform({ active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 28 }}>
      {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.45].map((h, i) => (
        <div key={i} className="wave-bar" style={{
          height: active ? 28 * h : 4,
          background: active ? '#5B21B6' : '#E2E0ED',
          animation: active ? `wave-bar ${0.6 + i * 0.08}s ease-in-out infinite alternate` : 'none',
          animationDelay: `${i * 0.06}s`,
          transition: 'height 0.3s, background 0.3s',
        }} />
      ))}
    </div>
  );
}

function Timer({ running }) {
  const [sec, setSec] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (running) { ref.current = setInterval(() => setSec(s => s + 1), 1000); }
    else { clearInterval(ref.current); if (!running) setSec(0); }
    return () => clearInterval(ref.current);
  }, [running]);
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  return (
    <span style={{
      fontSize: 13, fontWeight: 600, fontFamily: 'monospace',
      color: running ? '#EF4444' : '#9CA3AF',
      padding: '3px 10px', borderRadius: 6,
      background: running ? '#FEF2F2' : '#F7F7F8',
      border: `1px solid ${running ? '#FCA5A5' : '#EAEAF0'}`,
    }}>
      {running && <span style={{ marginRight: 5, color: '#EF4444', animation: 'pulse-dot 1.2s ease-in-out infinite' }}>●</span>}
      {fmt(sec)}
    </span>
  );
}

export default function Session() {
  const navigate = useNavigate();
  const { status, isConnected, isMicOn, connect, disconnect, startRecording, stopRecording, toggleMic } = useVoiceSession();
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const sc = STATUS[status] || STATUS.idle;

  const handleStart = () => { connect(); setSessionStarted(true); };
  const handleEnd = () => {
    if (isRecording) { stopRecording(); setIsRecording(false); }
    disconnect(); setSessionStarted(false);
  };
  const handleTalk = async () => {
    if (!isConnected) return;
    if (isRecording) { stopRecording(); setIsRecording(false); }
    else { await startRecording(); setIsRecording(true); }
  };

  return (
    <div style={{ background: '#F7F7F8', minHeight: '100vh', paddingTop: 60 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* ── Breadcrumb ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to="/" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}>← Home</Link>
            <span style={{ color: '#D1D5DB' }}>/</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111118', fontFamily: 'Space Grotesk, sans-serif' }}>
              Session with Eva
            </span>
          </div>
          <Timer running={isRecording} />
        </div>

        {/* ── Main grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

          {/* ── LEFT: Eva panel ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Identity card */}
            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
                {/* Avatar */}
                <div className={`${sessionStarted ? 'animate-float' : ''}`} style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: sessionStarted
                    ? 'linear-gradient(135deg, #5B21B6, #7C3AED)'
                    : '#F0EBFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 30, flexShrink: 0,
                  transition: 'background 0.4s',
                  boxShadow: sessionStarted ? '0 8px 24px rgba(91,33,182,0.25)' : 'none',
                }}>
                  🔬
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#5B21B6', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2, fontFamily: 'Space Grotesk, sans-serif' }}>
                    General Science
                  </p>
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111118', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 2 }}>
                    Eva
                  </h1>
                  <p style={{ fontSize: 13, color: '#6B7280' }}>Your AI science companion</p>
                </div>
              </div>

              {/* Status bar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10, background: sc.bg,
                border: `1px solid ${sc.color}30`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
                    background: sc.color,
                    boxShadow: `0 0 6px ${sc.color}`,
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{sc.label}</span>
                </div>
                {(status === 'playing' || status === 'listening') && (
                  <Waveform active={true} />
                )}
              </div>
            </div>

            {/* Topics / info card */}
            <div className="card" style={{ padding: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12, fontFamily: 'Space Grotesk, sans-serif' }}>
                What Eva Covers
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Physics', 'Chemistry', 'Biology', 'Astronomy', 'Mathematics', 'Earth Science'].map(t => (
                  <span key={t} style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    background: '#F0EBFF', color: '#5B21B6', border: '1px solid #DDD6FE',
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Instruction card */}
            <div style={{
              padding: 18, borderRadius: 12,
              background: '#F5F3FF', border: '1px solid #DDD6FE',
            }}>
              <p style={{ fontSize: 13, color: '#5B21B6', fontWeight: 500, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span>💡</span>
                <span>
                  {!sessionStarted && 'Press Start Session on the right to connect.'}
                  {sessionStarted && !isConnected && 'Connecting to Eva…'}
                  {isConnected && !isRecording && 'Eva is ready. Press Start Talking and ask your question.'}
                  {isRecording && 'Listening… speak your question, then press Stop.'}
                  {status === 'processing' && 'Processing your question…'}
                  {status === 'playing' && 'Eva is answering…'}
                </span>
              </p>
            </div>

          </div>

          {/* ── RIGHT: Controls ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* User card */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'linear-gradient(135deg, #5B21B6, #7C3AED)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, color: 'white',
                    fontFamily: 'Space Grotesk, sans-serif',
                  }}>
                    K
                  </div>
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 12, height: 12, borderRadius: '50%',
                    background: isConnected ? '#10B981' : '#D1D5DB',
                    border: '2px solid white',
                  }} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15, color: '#111118', fontFamily: 'Space Grotesk, sans-serif' }}>Karthik</p>
                  <p style={{ fontSize: 12, color: isConnected ? '#10B981' : '#9CA3AF', fontWeight: 500 }}>
                    {isConnected ? 'Connected' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>

            {/* Mic toggle */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: isMicOn ? '#F0EBFF' : '#FEF2F2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>
                    {isMicOn ? '🎙️' : '🔇'}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#111118', fontFamily: 'Space Grotesk, sans-serif' }}>
                      Microphone
                    </p>
                    <p style={{ fontSize: 12, color: isMicOn ? '#10B981' : '#EF4444' }}>
                      {isMicOn ? 'On' : 'Off'}
                    </p>
                  </div>
                </div>
                {/* Toggle */}
                <div
                  className="toggle-track"
                  style={{ background: isMicOn ? '#5B21B6' : '#E5E7EB' }}
                  onClick={toggleMic}
                >
                  <div className="toggle-thumb" style={{ left: isMicOn ? 23 : 3 }} />
                </div>
              </div>
            </div>

            {/* Talk button — only when session active */}
            {sessionStarted && isConnected && (
              <button
                onClick={handleTalk}
                disabled={!isMicOn && !isRecording}
                style={{
                  padding: '14px', borderRadius: 12, border: 'none',
                  background: isRecording ? '#EF4444' : '#5B21B6',
                  color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.02em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s', opacity: (!isMicOn && !isRecording) ? 0.5 : 1,
                  boxShadow: isRecording
                    ? '0 4px 16px rgba(239,68,68,0.3)'
                    : '0 4px 16px rgba(91,33,182,0.3)',
                }}
              >
                {isRecording ? '⏹ Stop Talking' : '🎤 Start Talking'}
              </button>
            )}

            {/* Start / End session */}
            {!sessionStarted ? (
              <button
                onClick={handleStart}
                style={{
                  padding: '14px', borderRadius: 12, border: 'none',
                  background: '#111118', color: 'white',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1F2937'}
                onMouseLeave={e => e.currentTarget.style.background = '#111118'}
              >
                🚀 Start Session
              </button>
            ) : (
              <button
                onClick={handleEnd}
                style={{
                  padding: '12px', borderRadius: 12,
                  background: '#FEF2F2', color: '#EF4444',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: '1px solid #FCA5A5',
                  fontFamily: 'Space Grotesk, sans-serif',
                  transition: 'all 0.2s',
                }}
              >
                End Session
              </button>
            )}

            {/* Stats strip */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                {[
                  { val: '4.9', label: 'Rating' },
                  { val: '41K', label: 'Sessions' },
                  { val: '<1s', label: 'Response' },
                ].map(({ val, label }) => (
                  <div key={label}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#5B21B6', fontFamily: 'Space Grotesk, sans-serif' }}>{val}</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
