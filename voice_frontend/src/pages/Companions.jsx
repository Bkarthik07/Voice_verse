import { Link } from 'react-router-dom';
import { companions } from '../data/companions';

export default function Companions() {
  return (
    <div style={{ background: '#F4F4F0', minHeight: '100vh' }}>
      <div style={{ background: '#0C0C14', paddingTop: 64 }}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <p className="section-label mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Choose Your</p>
          <h1 className="font-display text-7xl md:text-8xl text-white" style={{ letterSpacing: '0.02em' }}>
            SCIENCE <span style={{ color: '#E8530A' }}>COMPANIONS</span>
          </h1>
          <p className="text-white/50 mt-3 max-w-xl">
            Pick a specialized AI companion to start learning through voice conversation.
          </p>
        </div>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #5B21B6, #E8530A, transparent)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {companions.map((c, i) => (
            <Link key={c.id} to={`/session/${c.id}`}
              className="bg-white rounded-2xl overflow-hidden card-lift group animate-slide-up"
              style={{ border: '1.5px solid #E8E6F0', animationDelay: `${i * 0.08}s`, animationFillMode: 'both', textDecoration: 'none' }}>
              <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${c.borderColor}, ${c.accentColor})` }} />
              <div className="p-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 transition-all duration-300"
                  style={{ background: `${c.borderColor}15` }}>
                  {c.avatar}
                </div>
                <div className="section-label mb-1" style={{ color: c.borderColor }}>{c.field}</div>
                <h2 className="font-display text-4xl mb-2" style={{ color: '#0C0C14', letterSpacing: '0.03em' }}>
                  {c.name.toUpperCase()}
                </h2>
                <p className="text-sm mb-4" style={{ color: '#6B7280' }}>{c.tagline}</p>
                <div className="flex items-center justify-between pt-4"
                  style={{ borderTop: '1px solid #F0EEF8' }}>
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400 text-sm">★</span>
                    <span className="font-bold text-sm" style={{ color: '#0C0C14', fontFamily: 'Space Grotesk, sans-serif' }}>{c.rating}</span>
                  </div>
                  <span className="text-xs font-bold flex items-center gap-1 transition-all duration-300 group-hover:gap-2"
                    style={{ color: c.borderColor, fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.05em' }}>
                    START →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
