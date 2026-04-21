import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const MILESTONE_DEFS = [
  { key: 'joined',               emoji: '🚀', title: 'Joined VoiceVerse',     desc: 'Your science journey begins.',   },
  { key: 'first_session',        emoji: '🔬', title: 'First Voice Session',   desc: 'Complete a session with Eva.',   },
  { key: 'five_sessions',        emoji: '⚗️', title: '5 Sessions Completed', desc: 'Ask 5 science questions.',       },
  { key: 'ten_sessions',         emoji: '🌟', title: 'Science Explorer',      desc: 'Complete 10 sessions.',          },
  { key: 'twenty_five_sessions', emoji: '🏆', title: 'Science Champion',      desc: 'Complete 25 sessions.',          },
];

export default function Journey() {
  const { user }                = useAuth();
  const [stats,   setStats]   = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/sessions/stats'),
      api.get('/sessions/history?limit=10'),
    ])
      .then(([s, h]) => { setStats(s.data); setHistory(h.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const earnedKeys = new Set(stats?.milestones ?? []);
  const earned     = MILESTONE_DEFS.filter((m) => earnedKeys.has(m.key)).length;
  const total      = MILESTONE_DEFS.length;
  const pct        = Math.round((earned / total) * 100);

  return (
    <div style={{ background: '#F7F7F8', minHeight: '100vh', paddingTop: 60 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 60px' }}>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111118', marginBottom: 6, fontFamily: 'Space Grotesk, sans-serif' }}>
          My Journey
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 32 }}>
          Track your science learning milestones, {user?.username}.
        </p>

        {/* ── Progress card ────────────────────────────────── */}
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginBottom: 4 }}>Progress</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#5B21B6', fontFamily: 'Space Grotesk, sans-serif' }}>
                {loading ? '…' : earned} / {total}{' '}
                <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 400 }}>milestones</span>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#5B21B6', fontFamily: 'Space Grotesk, sans-serif' }}>
                  {loading ? '…' : `${pct}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Sessions',   val: loading ? '…' : stats?.total_sessions ?? 0    },
              { label: 'Questions',  val: loading ? '…' : stats?.total_interactions ?? 0 },
              { label: 'Milestones', val: loading ? '…' : earned                         },
            ].map(({ label, val }) => (
              <div key={label} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: '#F5F3FF', textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#5B21B6', fontFamily: 'Space Grotesk, sans-serif' }}>{val}</p>
                <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Milestones timeline ───────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MILESTONE_DEFS.map((m, i) => {
            const done = earnedKeys.has(m.key);
            return (
              <div key={i} className="card animate-slide-up" style={{
                padding: 18, display: 'flex', alignItems: 'center', gap: 16,
                opacity: done ? 1 : 0.55, animationDelay: `${i * 0.07}s`,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: done ? 'linear-gradient(135deg, #5B21B6, #7C3AED)' : '#F0F0F4',
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
                  background: done ? '#ECFDF5' : '#F4F4F6',
                  color: done ? '#059669' : '#9CA3AF',
                  border: `1px solid ${done ? '#A7F3D0' : '#E5E7EB'}`,
                  fontFamily: 'Space Grotesk, sans-serif', whiteSpace: 'nowrap',
                }}>
                  {done ? '✓ Done' : 'Locked'}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Recent sessions ───────────────────────────────── */}
        {!loading && history.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111118', marginBottom: 14, fontFamily: 'Space Grotesk, sans-serif' }}>
              Recent Sessions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map((s) => (
                <div key={s.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111118', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 2 }}>
                      Session with {s.companion?.charAt(0).toUpperCase() + s.companion?.slice(1)}
                    </p>
                    <p style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {new Date(s.started_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  {s.duration_s != null && (
                    <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>
                      {Math.floor(s.duration_s / 60)}m {s.duration_s % 60}s
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 32, textAlign: 'center' }}>
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
