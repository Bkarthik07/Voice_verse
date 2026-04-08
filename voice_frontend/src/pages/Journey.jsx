import { Link } from 'react-router-dom';

const milestones = [
  { emoji: '🚀', title: 'Joined VoiceVerse', desc: 'Your science journey begins.', done: true, date: 'Today' },
  { emoji: '🔬', title: 'First Voice Session', desc: 'Complete a session with Eva.', done: false, date: 'Locked' },
  { emoji: '⚗️', title: '5 Sessions Completed', desc: 'Ask 5 science questions.', done: false, date: 'Locked' },
  { emoji: '🌟', title: 'Science Explorer', desc: 'Complete 10 sessions.', done: false, date: 'Locked' },
];

export default function Journey() {
  return (
    <div style={{ background: '#F7F7F8', minHeight: '100vh', paddingTop: 60 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 60px' }}>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111118', marginBottom: 6, fontFamily: 'Space Grotesk, sans-serif' }}>
          My Journey
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 32 }}>
          Track your science learning milestones.
        </p>

        {/* Progress card */}
        <div className="card" style={{ padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginBottom: 4 }}>Progress</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#5B21B6', fontFamily: 'Space Grotesk, sans-serif' }}>
              1 / {milestones.length} <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 400 }}>milestones</span>
            </p>
          </div>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '3px solid #DDD6FE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#5B21B6', fontFamily: 'Space Grotesk, sans-serif' }}>25%</span>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {milestones.map((m, i) => (
            <div key={i} className="card animate-slide-up"
              style={{
                padding: 18, display: 'flex', alignItems: 'center', gap: 16,
                opacity: m.done ? 1 : 0.6,
                animationDelay: `${i * 0.07}s`,
              }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: m.done ? 'linear-gradient(135deg, #5B21B6, #7C3AED)' : '#F0F0F4',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>
                {m.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#111118', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 2 }}>
                  {m.title}
                </p>
                <p style={{ fontSize: 12, color: '#9CA3AF' }}>{m.desc}</p>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                background: m.done ? '#ECFDF5' : '#F4F4F6',
                color: m.done ? '#059669' : '#9CA3AF',
                border: `1px solid ${m.done ? '#A7F3D0' : '#E5E7EB'}`,
                fontFamily: 'Space Grotesk, sans-serif', whiteSpace: 'nowrap',
              }}>
                {m.done ? '✓ Done' : m.date}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <Link to="/session/eva" style={{
            display: 'inline-block', padding: '11px 28px', borderRadius: 10,
            background: '#5B21B6', color: 'white', fontWeight: 600,
            fontSize: 14, textDecoration: 'none', fontFamily: 'Space Grotesk, sans-serif',
          }}>
            Start a Session →
          </Link>
        </div>

      </div>
    </div>
  );
}
