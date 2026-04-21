import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const MILESTONE_DEFS = [
  { key: 'joined',               emoji: '🚀', title: 'Joined VoiceVerse',      desc: 'Your science journey begins.' },
  { key: 'first_session',        emoji: '🔬', title: 'First Voice Session',    desc: 'Completed a session with Eva.' },
  { key: 'five_sessions',        emoji: '⚗️', title: '5 Sessions Completed',  desc: 'Asked questions 5 times.' },
  { key: 'ten_sessions',         emoji: '🌟', title: 'Science Explorer',       desc: 'Completed 10 sessions.' },
  { key: 'twenty_five_sessions', emoji: '🏆', title: 'Science Champion',       desc: 'Completed 25 sessions.' },
];

function StatCard({ value, label, color = '#A78BFA' }) {
  return (
    <div style={{
      flex: 1, padding: '20px 16px', borderRadius: 16, textAlign: 'center',
      background: '#FFFFFF', border: '1.5px solid #E5E7EB',
    }}>
      <p style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'Space Grotesk, sans-serif', marginBottom: 4 }}>
        {value}
      </p>
      <p style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{label}</p>
    </div>
  );
}

export default function Profile() {
  const { user, logout, updateProfile } = useAuth();
  const [stats,    setStats]    = useState(null);
  const [history,  setHistory]  = useState([]);
  const [editing,  setEditing]  = useState(false);
  const [newName,  setNewName]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/sessions/stats'),
      api.get('/sessions/history?limit=5'),
    ])
      .then(([s, h]) => { setStats(s.data); setHistory(h.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try { await updateProfile({ username: newName.trim() }); setEditing(false); }
    catch (e) { console.error(e); }
    finally   { setSaving(false); }
  };

  const initial     = user?.username?.[0]?.toUpperCase() ?? '?';
  const earnedKeys  = new Set(stats?.milestones ?? []);
  const joinedDate  = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  const bg = { minHeight: '100vh', background: '#F7F7F8', paddingTop: 60, fontFamily: 'Inter, sans-serif' };

  return (
    <div style={bg}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 24px 60px' }}>

        {/* ── User hero ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: user?.avatar_color ?? '#5B21B6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 800, color: 'white',
            fontFamily: 'Space Grotesk, sans-serif',
            boxShadow: `0 12px 32px ${(user?.avatar_color ?? '#5B21B6')}60`,
            flexShrink: 0,
          }}>{initial}</div>

          <div style={{ flex: 1 }}>
            {editing ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={user?.username}
                  style={{
                    padding: '8px 12px', borderRadius: 10, border: '1.5px solid rgba(124,58,237,0.5)',
                    background: '#F9FAFB', color: 'white', fontSize: 18, fontWeight: 700,
                    fontFamily: 'Space Grotesk, sans-serif', outline: 'none',
                  }}
                  autoFocus
                />
                <button onClick={handleSaveName} disabled={saving} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#5B21B6', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? '…' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #E5E7EB', background: 'transparent', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111118', fontFamily: 'Space Grotesk, sans-serif' }}>
                  {user?.username}
                </h1>
                <button onClick={() => { setNewName(user?.username ?? ''); setEditing(true); }}
                  style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'transparent', color: '#6B7280', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
                  ✏️ Edit
                </button>
              </div>
            )}
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(124,58,237,0.2)', color: '#5B21B6', border: '1px solid rgba(124,58,237,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {user?.role}
              </span>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, color: '#9CA3AF', border: '1px solid #E5E7EB' }}>
                Joined {joinedDate}
              </span>
            </div>
          </div>

          <button onClick={logout} style={{
            padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)',
            background: 'rgba(239,68,68,0.08)', color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            Sign Out
          </button>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          <StatCard value={loading ? '…' : stats?.total_sessions ?? 0}    label="Sessions"     color="#A78BFA" />
          <StatCard value={loading ? '…' : stats?.total_interactions ?? 0} label="Questions"    color="#38BDF8" />
          <StatCard value={loading ? '…' : (stats?.milestones?.length ?? 0)} label="Milestones" color="#34D399" />
        </div>

        {/* ── Milestones ────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111118', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 14, letterSpacing: '0.04em' }}>
            MILESTONES
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MILESTONE_DEFS.map((m) => {
              const earned = earnedKeys.has(m.key);
              return (
                <div key={m.key} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14,
                  background: earned ? 'rgba(124,58,237,0.1)' : '#FFFFFF',
                  border: `1.5px solid ${earned ? 'rgba(124,58,237,0.25)' : '#F3F4F6'}`,
                  opacity: earned ? 1 : 0.45,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: earned ? 'linear-gradient(135deg, #4C1D95, #7C3AED)' : '#F3F4F6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>{m.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#111118', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 2 }}>{m.title}</p>
                    <p style={{ fontSize: 12, color: '#6B7280' }}>{m.desc}</p>
                  </div>
                  {earned && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(52,211,153,0.15)', color: '#34D399', border: '1px solid rgba(52,211,153,0.25)' }}>
                      ✓ Earned
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Recent sessions ───────────────────────────────────────── */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111118', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 14, letterSpacing: '0.04em' }}>
            RECENT SESSIONS
          </h2>
          {loading ? (
            <p style={{ color: '#9CA3AF', fontSize: 13 }}>Loading…</p>
          ) : history.length === 0 ? (
            <div style={{ padding: '24px', borderRadius: 14, border: '1px solid #E5E7EB', textAlign: 'center' }}>
              <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 12 }}>No sessions yet.</p>
              <Link to="/session/eva" style={{ color: '#5B21B6', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                Start your first session →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map((s) => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', borderRadius: 12,
                  background: '#FFFFFF', border: '1px solid #E5E7EB',
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111118', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 2 }}>
                      Session with {s.companion?.charAt(0).toUpperCase() + s.companion?.slice(1)}
                    </p>
                    <p style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {new Date(s.started_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {s.duration_s != null && (
                      <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                        {Math.floor(s.duration_s / 60)}m {s.duration_s % 60}s
                      </p>
                    )}
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                      background: s.status === 'completed' ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)',
                      color: s.status === 'completed' ? '#34D399' : '#FBBF24',
                      border: `1px solid ${s.status === 'completed' ? 'rgba(52,211,153,0.2)' : 'rgba(245,158,11,0.2)'}`,
                    }}>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
