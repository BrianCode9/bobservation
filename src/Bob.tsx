// Bob.tsx — IBM Bob robot mascot with mood effects

import bobImg from './assets/bob-standing-BECrMjXJ.webp';

export type BobMood = 'neutral' | 'observing' | 'cheering' | 'thinking' | 'concerned';

interface BobProps {
  mood?: BobMood;
  message?: string;
  size?: number;
}

// Binoculars SVG overlay shown when observing
function Binoculars({ size }: { size: number }) {
  const s = size * 0.55;
  return (
    <svg
      width={s}
      height={Math.round(s * 0.45)}
      viewBox="0 0 80 36"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
      aria-hidden
    >
      {/* Left barrel */}
      <rect x="2" y="4" width="30" height="22" rx="11" fill="#1F3D2B" stroke="#162d1f" strokeWidth="1.5" />
      {/* Right barrel */}
      <rect x="48" y="4" width="30" height="22" rx="11" fill="#1F3D2B" stroke="#162d1f" strokeWidth="1.5" />
      {/* Bridge */}
      <rect x="32" y="10" width="16" height="10" rx="3" fill="#1F3D2B" />
      {/* Lenses */}
      <circle cx="17" cy="15" r="8" fill="#60a5fa" opacity="0.8" />
      <circle cx="63" cy="15" r="8" fill="#60a5fa" opacity="0.8" />
      {/* Gleam */}
      <circle cx="20" cy="11" r="2.5" fill="white" opacity="0.55" />
      <circle cx="66" cy="11" r="2.5" fill="white" opacity="0.55" />
    </svg>
  );
}

// Motion lines for cheering
function CheerLines({ size }: { size: number }) {
  const w = size;
  return (
    <svg width={w} height={w} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
      <line x1="8" y1="30" x2="22" y2="42" stroke="#F26B1D" strokeWidth="3" strokeLinecap="round" />
      <line x1="4" y1="52" x2="20" y2="52" stroke="#F26B1D" strokeWidth="3" strokeLinecap="round" />
      <line x1="8" y1="74" x2="22" y2="62" stroke="#F26B1D" strokeWidth="3" strokeLinecap="round" />
      <line x1="112" y1="30" x2="98" y2="42" stroke="#F26B1D" strokeWidth="3" strokeLinecap="round" />
      <line x1="116" y1="52" x2="100" y2="52" stroke="#F26B1D" strokeWidth="3" strokeLinecap="round" />
      <line x1="112" y1="74" x2="98" y2="62" stroke="#F26B1D" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Bob({ mood = 'neutral', message, size = 120 }: BobProps) {
  // CSS filter per mood
  const filter =
    mood === 'observing'  ? 'none' :
    mood === 'cheering'   ? 'brightness(1.08) saturate(1.2)' :
    mood === 'thinking'   ? 'sepia(0.25) brightness(0.97)' :
    mood === 'concerned'  ? 'saturate(0.6) brightness(0.93)' :
    'none';

  // Scale pulse for cheering
  const animStyle: React.CSSProperties =
    mood === 'cheering'
      ? { animation: 'bob-bounce 0.55s ease-in-out infinite alternate' }
      : mood === 'observing'
      ? { animation: 'bob-wobble 1.8s ease-in-out infinite' }
      : {};

  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes bob-bounce {
          from { transform: translateY(0); }
          to   { transform: translateY(-8px); }
        }
        @keyframes bob-wobble {
          0%,100% { transform: rotate(-2deg); }
          50%      { transform: rotate(2deg); }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        {/* Speech bubble */}
        {message && (
          <div style={{
            position: 'relative',
            background: '#FDFAF3',
            border: '2px solid #D9CFBF',
            borderRadius: '4px',
            padding: '8px 14px',
            maxWidth: '260px',
            fontFamily: "'Instrument Sans', sans-serif",
            fontSize: '1.05rem',
            lineHeight: 1.4,
            color: '#1F3D2B',
            boxShadow: '3px 3px 0 #D9CFBF',
            textAlign: 'center',
          }}>
            {message}
            <span style={{
              position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '10px solid #D9CFBF',
            }} />
            <span style={{
              position: 'absolute', bottom: '-7px', left: '50%', transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid #FDFAF3',
            }} />
          </div>
        )}

        {/* Bob image + overlays */}
        <div style={{ position: 'relative', width: size, height: size, ...animStyle }}>
          {/* Cheering radial lines */}
          {mood === 'cheering' && <CheerLines size={size} />}

          <img
            src={bobImg}
            alt={`Bob — ${mood}`}
            width={size}
            height={size}
            style={{ display: 'block', filter, userSelect: 'none', pointerEvents: 'none' }}
          />

          {/* Binoculars overlay when observing */}
          {mood === 'observing' && (
            <div style={{
              position: 'absolute',
              bottom: Math.round(size * 0.22) + 'px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}>
              <Binoculars size={size} />
            </div>
          )}

          {/* Thinking bubble */}
          {mood === 'thinking' && (
            <div style={{
              position: 'absolute', top: 0, right: -4,
              fontFamily: "'Instrument Sans', sans-serif", fontSize: Math.round(size * 0.22) + 'px',
              lineHeight: 1,
            }}>
              💭
            </div>
          )}

          {/* Concerned sweat */}
          {mood === 'concerned' && (
            <div style={{
              position: 'absolute', top: Math.round(size * 0.08) + 'px', right: Math.round(size * 0.04) + 'px',
              fontFamily: 'sans-serif', fontSize: Math.round(size * 0.2) + 'px',
              lineHeight: 1,
            }}>
              😰
            </div>
          )}
        </div>
      </div>
    </>
  );
}

