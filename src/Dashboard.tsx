// Dashboard.tsx — field-notebook session tracker

import { useState, useEffect } from 'react';
import type { FullSession } from './storage';
import { loadSessions } from './storage';
import { Bob } from './Bob';
import { Plus, ChevronRight, Calendar } from 'lucide-react';

interface DashboardProps {
  onOpenSession: (session: FullSession) => void;
  onNewInterview: () => void;
}

function scoreRingColor(n: number) {
  return n >= 70 ? '#1d5c35' : n >= 45 ? '#b8860b' : '#C8462B';
}

export function Dashboard({ onOpenSession, onNewInterview }: DashboardProps) {
  const [sessions, setSessions] = useState<FullSession[]>([]);

  useEffect(() => {
    loadSessions().then(setSessions);
  }, []);

  const bobMsg = sessions.length > 0
    ? `Bob has been watching. ${sessions.length} field observation${sessions.length !== 1 ? 's' : ''} logged.`
    : 'No observations yet. Bob is ready to take notes.';

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2.5rem 1.5rem 2rem' }}>

      {/* ── Hero ── */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <Bob mood={sessions.length > 0 ? 'observing' : 'neutral'} message={bobMsg} size={110} />
        <div>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 900, fontSize: '3rem', color: '#1F3D2B', margin: 0, lineHeight: 1 }}>
            Field<br />Log
          </h1>
          <p style={{ color: '#5A7060', marginTop: '0.5rem', fontSize: '1rem', fontFamily: "'Instrument Sans', sans-serif" }}>
            Your mock interview observations
          </p>
        </div>
      </div>

      {/* ── New interview button ── */}
      <button
        onClick={onNewInterview}
        className="btn btn-primary btn-full btn-lg"
        style={{ marginBottom: '2rem' }}
      >
        <Plus size={18} />
        New Mock Interview
      </button>

      {/* ── Session list ── */}
      {sessions.length === 0 ? (
        <div className="nb-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '1.25rem', color: '#5A7060' }}>
            Complete an interview to see it here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => onOpenSession(session)}
              className="nb-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                background: '#FDFAF3',
                transition: 'box-shadow 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '4px 4px 0 #D9CFBF')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '3px 3px 0 #D9CFBF')}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: '1.125rem', color: '#1F3D2B' }}>
                  {session.role}
                </div>
                <div style={{ fontFamily: "'Instrument Sans', sans-serif", color: '#5A7060', fontSize: '0.875rem', marginTop: '2px' }}>
                  {session.company}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", color: '#5A7060', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={11} />
                  {new Date(session.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                {/* Score circle */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '3.25rem', height: '3.25rem', borderRadius: '50%',
                    border: `3px solid ${scoreRingColor(session.overallScore)}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Fraunces', Georgia, serif", fontWeight: 900, fontSize: '1.125rem',
                    color: scoreRingColor(session.overallScore),
                  }}>
                    {session.overallScore}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#5A7060', marginTop: '3px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Score</div>
                </div>

                {/* Fit circle */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '3.25rem', height: '3.25rem', borderRadius: '50%',
                    border: `3px solid ${scoreRingColor(session.fitScore)}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Fraunces', Georgia, serif", fontWeight: 900, fontSize: '1rem',
                    color: scoreRingColor(session.fitScore),
                  }}>
                    {session.fitScore}%
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#5A7060', marginTop: '3px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Fit</div>
                </div>

                <ChevronRight size={18} style={{ color: '#D9CFBF' }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

