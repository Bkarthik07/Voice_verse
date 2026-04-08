import { useNavigate } from 'react-router-dom';

const steps = [
  { icon: '🎙️', title: 'Choose a session', desc: 'Pick your science topic and start talking' },
  { icon: '💬', title: 'Ask your question', desc: 'Speak naturally — Eva listens and understands' },
  { icon: '⚡', title: 'Get your answer', desc: 'Hear a clear voice explanation instantly' },
];

const topics = ['Physics', 'Chemistry', 'Biology', 'Astronomy', 'Earth Science', 'Math'];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ background: '#F7F7F8', minHeight: '100vh', paddingTop: 60 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* ── Hero ── */}
        <div className="animate-slide-up" style={{ textAlign: 'center', marginBottom: 56 }}>
          {/* Badge */}
          <span style={{
            display: 'inline-block', marginBottom: 20,
            padding: '5px 14px', borderRadius: 100,
            background: '#F0EBFF', color: '#5B21B6',
            fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
            border: '1px solid #DDD6FE',
          }}>
            Science AI Companion
          </span>

          <h1 style={{
            fontSize: 36, fontWeight: 700, color: '#111118',
            lineHeight: 1.25, marginBottom: 16,
            fontFamily: 'Space Grotesk, sans-serif',
          }}>
            Learn Science Through<br />
            <span style={{ color: '#5B21B6' }}>Voice Conversation</span>
          </h1>

          <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Talk with Eva, your AI science companion. Ask any science question and get a clear, spoken explanation in seconds.
          </p>

          <button
            onClick={() => navigate('/session/eva')}
            style={{
              background: '#5B21B6', color: '#fff', border: 'none',
              padding: '12px 32px', borderRadius: 10,
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Space Grotesk, sans-serif',
              transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(91,33,182,0.25)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#4C1D95'}
            onMouseLeave={e => e.currentTarget.style.background = '#5B21B6'}
          >
            Start Talking →
          </button>
        </div>

        {/* ── Eva companion card ── */}
        <div
          className="card animate-slide-up"
          style={{ padding: 32, marginBottom: 40, animationDelay: '0.1s' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Avatar */}
            <div className="animate-float" style={{
              width: 72, height: 72, borderRadius: 18,
              background: 'linear-gradient(135deg, #5B21B6, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 34, flexShrink: 0,
              boxShadow: '0 8px 24px rgba(91,33,182,0.2)',
            }}>
              🔬
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: '#5B21B6',
                letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4,
                fontFamily: 'Space Grotesk, sans-serif',
              }}>
                General Science
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111118', marginBottom: 4, fontFamily: 'Space Grotesk, sans-serif' }}>
                Eva
              </h2>
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5 }}>
                Ask anything across all science disciplines
              </p>
            </div>

            {/* Rating */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: 4 }}>
                <span style={{ color: '#F59E0B', fontSize: 14 }}>★</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: '#111118', fontFamily: 'Space Grotesk, sans-serif' }}>4.9</span>
              </div>
              <p style={{ fontSize: 12, color: '#9CA3AF' }}>41K sessions</p>
            </div>
          </div>

          {/* Topics */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #F0F0F4' }}>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10, fontWeight: 500 }}>Covers</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {topics.map(t => (
                <span key={t} style={{
                  padding: '4px 12px', borderRadius: 20,
                  background: '#F0EBFF', color: '#5B21B6',
                  fontSize: 12, fontWeight: 500,
                  border: '1px solid #DDD6FE',
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 style={{
            fontSize: 18, fontWeight: 700, color: '#111118',
            marginBottom: 20, fontFamily: 'Space Grotesk, sans-serif',
          }}>
            How it works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {steps.map((s, i) => (
              <div key={i} className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{s.icon}</div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111118', marginBottom: 4, fontFamily: 'Space Grotesk, sans-serif' }}>
                  {s.title}
                </p>
                <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
