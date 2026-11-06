// Questions.tsx — full-page question history view

import { useState, useEffect } from 'react';
import { loadQuestionHistory, saveQuestionHistory } from './storage';
import type { QuestionHistoryEntry } from './storage';
import { Bob } from './Bob';
import { Search, Trash2, BookOpen } from 'lucide-react';

export function Questions() {
  const [query, setQuery] = useState('');
  const [all, setAll] = useState<QuestionHistoryEntry[]>([]);

  useEffect(() => {
    loadQuestionHistory().then(setAll);
  }, []);

  const filtered = query.trim()
    ? all.filter(e =>
        e.question.toLowerCase().includes(query.toLowerCase()) ||
        e.company.toLowerCase().includes(query.toLowerCase()) ||
        e.role.toLowerCase().includes(query.toLowerCase())
      )
    : all;

  // Group by company + role
  const groups: Record<string, typeof filtered> = {};
  for (const entry of filtered) {
    const key = `${entry.company} — ${entry.role}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }

  async function handleClear() {
    if (!confirm('Clear all question history? This cannot be undone.')) return;
    await saveQuestionHistory([]);
    setAll([]);
  }

  const bobMsg = all.length === 0
    ? 'No questions logged yet. Complete an interview and save it.'
    : `Bob has ${all.length} question${all.length !== 1 ? 's' : ''} on file.`;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <Bob mood={all.length > 0 ? 'observing' : 'neutral'} message={bobMsg} size={100} />
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 900, fontSize: '3rem', color: '#1F3D2B',
            margin: 0, lineHeight: 1,
          }}>
            Question<br />Bank
          </h1>
          <p style={{ fontFamily: "'Instrument Sans', sans-serif", color: '#5A7060', marginTop: '0.5rem' }}>
            Every question asked across all your sessions
          </p>
        </div>
      </div>

      {/* ── Search + clear ── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.75rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#5A7060', pointerEvents: 'none' }}
          />
          <input
            className="nb-input"
            style={{ paddingLeft: '2rem' }}
            placeholder="Search questions, company, or role…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        {all.length > 0 && (
          <button
            onClick={handleClear}
            className="btn btn-ghost"
            style={{ color: '#C8462B', borderColor: '#C8462B', boxShadow: '2px 2px 0 #9a2e1c', flexShrink: 0 }}
          >
            <Trash2 size={14} />
            Clear all
          </button>
        )}
      </div>

      {/* ── Empty state ── */}
      {all.length === 0 && (
        <div className="nb-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <BookOpen size={32} style={{ color: '#D9CFBF', margin: '0 auto 1rem' }} />
          <p style={{ fontFamily: "'Caveat', cursive", fontSize: '1.25rem', color: '#5A7060' }}>
            Complete and save an interview to populate the question bank.
          </p>
        </div>
      )}

      {/* ── No results ── */}
      {all.length > 0 && filtered.length === 0 && (
        <div className="nb-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Caveat', cursive", fontSize: '1.1rem', color: '#5A7060' }}>
            No questions match "{query}"
          </p>
        </div>
      )}

      {/* ── Groups ── */}
      {Object.entries(groups).map(([groupKey, entries]) => (
        <div key={groupKey} style={{ marginBottom: '2rem' }}>
          {/* Group header */}
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: '0.75rem',
            paddingBottom: '0.4rem',
            borderBottom: '2px solid #1F3D2B',
            marginBottom: '0.75rem',
          }}>
            <h2 style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontWeight: 700, fontSize: '1.125rem', color: '#1F3D2B',
              margin: 0,
            }}>
              {groupKey}
            </h2>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.75rem', color: '#5A7060',
            }}>
              {entries.length} question{entries.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Question rows */}
          <div className="nb-card" style={{ overflow: 'hidden' }}>
            {entries.map((entry, i) => {
              const scoreColor = entry.score === undefined ? '#5A7060'
                : entry.score >= 70 ? '#1d5c35'
                : entry.score >= 45 ? '#b8860b'
                : '#C8462B';

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '1rem',
                    padding: '0.75rem 1rem',
                    borderBottom: i < entries.length - 1 ? '1px solid #D9CFBF' : 'none',
                    background: i % 2 === 0 ? '#FDFAF3' : '#faf6ec',
                  }}
                >
                  {/* Question number badge */}
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: '0.6875rem',
                    color: '#D9CFBF',
                    letterSpacing: '0.04em',
                    flexShrink: 0,
                    paddingTop: '3px',
                    minWidth: '1.5rem',
                    textAlign: 'right',
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>

                  {/* Question text */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: "'Instrument Sans', sans-serif",
                      fontSize: '0.9375rem',
                      color: '#1F3D2B',
                      lineHeight: 1.5,
                    }}>
                      {entry.question}
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.6875rem',
                      color: '#5A7060',
                      marginTop: '3px',
                    }}>
                      {new Date(entry.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </div>
                  </div>

                  {/* Score badge */}
                  {entry.score !== undefined && (
                    <div style={{
                      fontFamily: "'Fraunces', Georgia, serif",
                      fontWeight: 900,
                      fontSize: '1.125rem',
                      color: scoreColor,
                      flexShrink: 0,
                      lineHeight: 1,
                      paddingTop: '2px',
                    }}>
                      {entry.score}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
