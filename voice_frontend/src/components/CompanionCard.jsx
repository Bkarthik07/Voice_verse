import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const DIFFICULTY_STYLES = {
  Beginner:     { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  Intermediate: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  Advanced:     { bg: '#FDF2F8', color: '#701A75', border: '#F5D0FE' },
};

export default function CompanionCard({ companion, index }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const diff = DIFFICULTY_STYLES[companion.difficulty] || DIFFICULTY_STYLES.Intermediate;

  return (
    <div
      id={`companion-card-${companion.id}`}
      className="card-lift relative bg-white rounded-2xl overflow-hidden cursor-pointer animate-slide-up flex flex-col"
      style={{
        animationDelay: `${index * 0.08}s`,
        animationFillMode: 'both',
        border: hovered ? `2px solid ${companion.borderColor}` : '2px solid #E8E6F0',
        transition: 'border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/session/${companion.id}`)}
    >
      {/* ── Colored top strip ── */}
      <div
        className="h-2 w-full transition-all duration-300"
        style={{
          background: hovered
            ? `linear-gradient(90deg, ${companion.borderColor}, ${companion.accentColor})`
            : `${companion.borderColor}60`,
        }}
      />

      <div className="p-6 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between mb-5">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-all duration-400"
            style={{
              background: hovered
                ? `linear-gradient(135deg, ${companion.borderColor}, ${companion.accentColor})`
                : `${companion.borderColor}15`,
              transform: hovered ? 'scale(1.08) rotate(-4deg)' : 'scale(1)',
              fontSize: '28px',
            }}
          >
            {companion.avatar}
          </div>
          {/* Difficulty pill */}
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: diff.bg, color: diff.color, border: `1px solid ${diff.border}`, fontFamily: 'Space Grotesk, sans-serif' }}>
            {companion.difficulty}
          </span>
        </div>

        {/* Field label */}
        <span className="section-label mb-2" style={{ color: companion.borderColor }}>
          {companion.field}
        </span>

        {/* Name */}
        <h3 className="font-display text-4xl mb-1 tracking-wide leading-none" style={{ color: '#0C0C14' }}>
          {companion.name.toUpperCase()}
        </h3>

        {/* Tagline */}
        <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: '#6B7280' }}>
          {companion.tagline}
        </p>

        {/* Topics */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {companion.topics.slice(0, 3).map(t => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-md font-medium"
              style={{
                background: `${companion.borderColor}12`,
                color: companion.borderColor,
                border: `1px solid ${companion.borderColor}30`,
                fontFamily: 'Space Grotesk, sans-serif',
              }}>
              {t}
            </span>
          ))}
          {companion.topics.length > 3 && (
            <span className="text-xs px-2.5 py-1 rounded-md font-medium"
              style={{ background: '#F4F4F0', color: '#9091A0', border: '1px solid #E2E0ED' }}>
              +{companion.topics.length - 3} more
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 flex items-center justify-between"
          style={{ borderTop: '1px solid #F0EEF8' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-amber-400 text-sm">★</span>
              <span className="text-sm font-bold" style={{ color: '#0C0C14', fontFamily: 'Space Grotesk, sans-serif' }}>
                {companion.rating}
              </span>
            </div>
            <span className="text-xs" style={{ color: '#C4C2D4' }}>•</span>
            <span className="text-xs" style={{ color: '#9091A0' }}>{companion.sessions} sessions</span>
          </div>
          <div
            className="flex items-center gap-1.5 text-xs font-bold transition-all duration-300"
            style={{
              color: hovered ? companion.borderColor : '#0C0C14',
              fontFamily: 'Space Grotesk, sans-serif',
              letterSpacing: '0.05em',
            }}
          >
            START CHAT
            <svg
              className="w-3.5 h-3.5 transition-transform duration-300"
              style={{ transform: hovered ? 'translateX(4px)' : 'none' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
