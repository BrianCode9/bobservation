// Report.tsx — field-notebook report card

import { Bob } from './Bob';
import type { Metrics, Rating } from './metrics';
import { rateMetric, overallScore } from './metrics';
import { generateObservations } from './observations';
import type { AnswerRecord, ReplayEvent } from './storage';
import { Save, RotateCcw, CheckCircle, Circle, XCircle, Video, Heart, Sparkles, Loader, ClipboardCopy, Download } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { gradeAnswerContent, gradeWithAI, checkAIAvailable } from './answerGrader';
import type { ContentScore } from './answerGrader';
import { likeQuestion, isQuestionLiked } from './userProfile';

interface ReportProps {
  answers: AnswerRecord[];
  mode: 'friendly' | 'tough';
  postingSkills: string[];
  fitScoreValue: number;
  company: string;
  role: string;
  onSave: (updatedAnswers?: AnswerRecord[]) => void;
  onRestart: () => void;
}

const METRIC_LABELS: Record<keyof Metrics, string> = {
  eyeContactPct: 'Eye Contact',
  headMovement: 'Head Steadiness',
  smilePct: 'Smile',
  fillersPerMin: 'Filler Words',
  wordsPerMin: 'Speaking Pace',
  longPauses: 'Long Pauses',
  starKeywords: 'STAR Structure',
};

const METRIC_FORMAT: Record<keyof Metrics, (v: number) => string> = {
  eyeContactPct: v => `${v}%`,
  headMovement: v => v < 0.004 ? 'Steady' : v <= 0.01 ? 'Moderate' : 'Active',
  smilePct: v => `${v}%`,
  fillersPerMin: v => `${v}/min`,
  wordsPerMin: v => `${v} wpm`,
  longPauses: v => `${v}`,
  starKeywords: v => `${v}/4`,
};

const RATING_BORDER: Record<Rating, string> = {
  good:         '#3a7d54',
  okay:         '#b8860b',
  'needs work': '#C8462B',
};

const RATING_BG: Record<Rating, string> = {
  good:         '#eaf5ee',
  okay:         '#fdf8e1',
  'needs work': '#fdf1ef',
};

const RATING_TEXT: Record<Rating, string> = {
  good:         '#1d5c35',
  okay:         '#7a5c00',
  'needs work': '#C8462B',
};

function RatingIcon({ rating }: { rating: Rating }) {
  if (rating === 'good') return <CheckCircle size={16} style={{ color: '#3a7d54', flexShrink: 0 }} />;
  if (rating === 'okay') return <Circle size={16} style={{ color: '#b8860b', flexShrink: 0 }} />;
  return <XCircle size={16} style={{ color: '#C8462B', flexShrink: 0 }} />;
}

function averageMetrics(answers: AnswerRecord[]): Metrics {
  if (answers.length === 0) {
    return { eyeContactPct: 0, headMovement: 0, smilePct: 0, fillersPerMin: 0, wordsPerMin: 0, longPauses: 0, starKeywords: 0 };
  }
  const keys = ['eyeContactPct', 'headMovement', 'smilePct', 'fillersPerMin', 'wordsPerMin', 'longPauses', 'starKeywords'] as (keyof Metrics)[];
  const result = {} as Metrics;
  for (const key of keys) {
    const sum = answers.reduce((s, a) => s + ((a.metrics as Record<string, number>)[key] ?? 0), 0);
    result[key] = Math.round((sum / answers.length) * 10) / 10;
  }
  return result;
}

function highlightFillers(text: string): React.ReactNode {
  const fillerRe = /\b(um|uh|like|you know|basically|kind of)\b/gi;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = fillerRe.exec(text)) !== null) {
    parts.push(text.slice(last, match.index));
    parts.push(<mark key={match.index} className="filler-mark">{match[0]}</mark>);
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}

function scoreCircleColor(n: number) {
  return n >= 70 ? '#1d5c35' : n >= 45 ? '#b8860b' : '#C8462B';
}

// ── Extra 1: Replay player with timeline markers ──────────────────────────────
const EVENT_COLORS: Record<ReplayEvent['type'], string> = {
  'looked-away': '#C8462B',
  'filler':      '#F26B1D',
  'long-pause':  '#b8860b',
  'nudge':       '#1F3D2B',
};

function ReplayPlayer({ answer }: { answer: AnswerRecord }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  if (!answer.videoBlobUrl) return null;

  const events = answer.events ?? [];

  // Estimate duration from events; fallback to 120s
  const maxOffset = events.length > 0 ? Math.max(...events.map(e => e.offsetMs)) : 0;
  const durationMs = Math.max(maxOffset + 2000, 10000);

  function seekTo(offsetMs: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = offsetMs / 1000;
    v.play();
  }

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
        <Video size={14} style={{ color: '#5A7060' }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', color: '#5A7060', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Replay · {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
      </div>
      <video
        ref={videoRef}
        src={answer.videoBlobUrl}
        controls
        style={{ width: '100%', borderRadius: '3px', background: '#1F3D2B', border: '1.5px solid #D9CFBF', display: 'block', transform: 'scaleX(-1)', maxHeight: '220px', objectFit: 'cover' }}
      />
      {/* Timeline */}
      {events.length > 0 && (
        <div style={{ marginTop: '8px', position: 'relative', height: '28px', background: '#F6F1E7', border: '1.5px solid #D9CFBF', borderRadius: '2px', overflow: 'hidden' }}>
          {events.map((ev, i) => {
            const pct = Math.min((ev.offsetMs / durationMs) * 100, 98);
            return (
              <button
                key={i}
                title={ev.label}
                onClick={() => seekTo(ev.offsetMs)}
                style={{
                  position: 'absolute',
                  left: `${pct}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: EVENT_COLORS[ev.type],
                  border: '1.5px solid white',
                  cursor: 'pointer',
                  padding: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              />
            );
          })}
        </div>
      )}
      {/* Legend */}
      {events.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
          {(['looked-away', 'filler', 'long-pause', 'nudge'] as ReplayEvent['type'][]).filter(t => events.some(e => e.type === t)).map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: EVENT_COLORS[t] }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.625rem', color: '#5A7060', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t.replace('-', ' ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AnswerCard: content grade + AI grader + like + notes ─────────────────────
const GRADE_COLOR: Record<string, string> = { A: '#1d5c35', B: '#3a7d54', C: '#b8860b', D: '#C8462B', F: '#9a2e1c' };

function AnswerCard({
  answer,
  index,
  postingSkills,
  company,
  role,
  mode,
  aiAvailable,
  onNotesChange,
}: {
  answer: AnswerRecord;
  index: number;
  postingSkills: string[];
  company: string;
  role: string;
  mode: 'friendly' | 'tough';
  aiAvailable: boolean;
  onNotesChange: (index: number, notes: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [aiGrade, setAiGrade] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesValue, setNotesValue] = useState(answer.notes ?? '');

  useEffect(() => {
    isQuestionLiked(answer.question).then(setLiked);
  }, [answer.question]);

  const contentScore: ContentScore = gradeAnswerContent(answer.transcript, answer.question, postingSkills);

  async function handleLike() {
    await likeQuestion(answer.question, company, role);
    setLiked(true);
  }

  async function handleAIGrade() {
    setAiLoading(true);
    try {
      const result = await gradeWithAI(answer.transcript, answer.question, postingSkills, mode);
      setAiGrade(result);
    } catch (e) {
      setAiGrade(`AI grader ran into trouble: ${e instanceof Error ? e.message : 'unknown error'}`);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="nb-card" style={{ padding: '1rem 1.25rem' }}>
      {/* Question header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.625rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#5A7060' }}>
            Q{index + 1}
          </div>
          <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: '1rem', color: '#1F3D2B', lineHeight: 1.3, marginTop: '2px' }}>
            {answer.question}
          </div>
        </div>

        {/* Grade badge */}
        <div style={{
          fontFamily: "'Fraunces', Georgia, serif", fontWeight: 900, fontSize: '2rem',
          color: GRADE_COLOR[contentScore.grade] ?? '#5A7060',
          lineHeight: 1, flexShrink: 0,
        }}>
          {contentScore.grade}
        </div>

        {/* Like button */}
        <button
          onClick={handleLike}
          disabled={liked}
          title={liked ? 'Saved' : 'Save question'}
          style={{
            background: 'none', border: 'none', cursor: liked ? 'default' : 'pointer',
            color: liked ? '#C8462B' : '#D9CFBF', padding: '2px', flexShrink: 0,
          }}
        >
          <Heart size={16} fill={liked ? '#C8462B' : 'none'} />
        </button>
      </div>

      {/* Content score bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '4px', marginBottom: '0.625rem' }}>
        {([
          ['Specific', contentScore.specificity],
          ['Depth', contentScore.depth],
          ['Relevant', contentScore.relevance],
          ['STAR', contentScore.structure],
          ['Clarity', contentScore.clarity],
        ] as [string, number][]).map(([label, val]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ height: '4px', background: '#D9CFBF', borderRadius: '2px', overflow: 'hidden', marginBottom: '3px' }}>
              <div style={{
                height: '100%',
                width: `${val}%`,
                background: val >= 70 ? '#3a7d54' : val >= 45 ? '#b8860b' : '#C8462B',
                borderRadius: '2px',
              }} />
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#5A7060', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      {contentScore.tips.length > 0 && (
        <ul style={{ margin: '0 0 0.625rem', padding: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {contentScore.tips.map((tip, i) => (
            <li key={i} style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '1rem', color: '#5A7060', display: 'flex', gap: '6px', lineHeight: 1.4 }}>
              <span style={{ flexShrink: 0 }}>→</span>
              {tip}
            </li>
          ))}
        </ul>
      )}

      {/* Transcript */}
      {answer.transcript && (
        <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '0.9rem', color: '#1F3D2B', lineHeight: 1.6, marginBottom: '0.625rem' }}>
          {highlightFillers(answer.transcript)}
        </div>
      )}
      {!answer.transcript && (
        <div style={{ fontFamily: "'Instrument Sans', sans-serif", color: '#5A7060', fontStyle: 'italic', marginBottom: '0.625rem' }}>No transcript recorded</div>
      )}

      {/* AI Grader */}
      {aiAvailable && (
        <div style={{ marginTop: '0.75rem', borderTop: '1px solid #D9CFBF', paddingTop: '0.75rem' }}>
          {!aiGrade && !aiLoading && (
            <button onClick={handleAIGrade} className="btn btn-ghost" style={{ fontSize: '0.8125rem', padding: '5px 12px' }}>
              <Sparkles size={13} style={{ color: '#F26B1D' }} />
              AI Grader
            </button>
          )}
          {aiLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#5A7060' }}>
              <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Grading your answer…
            </div>
          )}
          {aiGrade && (
            <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '1.1rem', color: '#1F3D2B', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Sparkles size={14} style={{ color: '#F26B1D' }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#5A7060', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Grader</span>
              </div>
              {aiGrade}
            </div>
          )}
        </div>
      )}

      {/* Per-answer notes */}
      <div style={{ marginTop: '0.75rem', borderTop: '1px solid #D9CFBF', paddingTop: '0.625rem' }}>
        <button
          type="button"
          onClick={() => setNotesOpen(o => !o)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', gap: '5px',
            fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, fontSize: '0.8rem',
            color: notesValue ? '#1F3D2B' : '#5A7060',
          }}
        >
          📝 {notesOpen ? 'Hide notes' : (notesValue ? 'Edit note' : 'Add note')}
        </button>
        {notesOpen && (
          <textarea
            value={notesValue}
            onChange={e => {
              setNotesValue(e.target.value);
              onNotesChange(index, e.target.value);
            }}
            placeholder="Your personal notes on this answer…"
            className="nb-input"
            style={{ marginTop: '0.5rem', height: '80px', resize: 'vertical', display: 'block', lineHeight: 1.5, fontSize: '0.9rem' }}
          />
        )}
        {!notesOpen && notesValue && (
          <p style={{ margin: '4px 0 0', fontFamily: "'Instrument Sans', sans-serif", fontSize: '1rem', color: '#5A7060', lineHeight: 1.4 }}>
            {notesValue}
          </p>
        )}
      </div>

      {/* Replay player */}
      <ReplayPlayer answer={answer} />
    </div>
  );
}

export function Report({ answers: initialAnswers, mode, postingSkills, fitScoreValue, company, role, onSave, onRestart }: ReportProps) {
  // answers is mutable here (notes editing) — lift to state
  const [answers, setAnswers] = useState(initialAnswers);

  const metrics = averageMetrics(answers);
  const overall = overallScore(metrics);
  const fullTranscript = answers.map(a => a.transcript).join(' ');
  const observations = generateObservations(metrics, mode, postingSkills, fullTranscript);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkAIAvailable().then(setAiAvailable).catch(() => setAiAvailable(false));
  }, []);

  function handleNotesChange(index: number, notes: string) {
    setAnswers(prev => prev.map((a, i) => i === index ? { ...a, notes } : a));
  }

  function buildReportText(): string {
    const date = new Date().toLocaleDateString('en-US', { dateStyle: 'long' });
    const lines: string[] = [
      `BOB'S OBSERVATIONS — ${company} · ${role}`,
      `Date: ${date} | Mode: ${mode} | Overall: ${overall}/100 | Fit: ${fitScoreValue}%`,
      '',
      '── FIELD NOTES ──────────────────────────────────────────',
      ...observations.map(o => `  • ${o}`),
      '',
      '── ANSWERS ──────────────────────────────────────────────',
      ...answers.flatMap((a, i) => [
        '',
        `Q${i + 1}: ${a.question}`,
        `Transcript: ${a.transcript || '(no transcript)'}`,
        ...(a.notes ? [`Notes: ${a.notes}`] : []),
      ]),
    ];
    return lines.join('\n');
  }

  async function handleCopyReport() {
    try {
      await navigator.clipboard.writeText(buildReportText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: download as text
      handleDownloadReport();
    }
  }

  function handleDownloadReport() {
    const blob = new Blob([buildReportText()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bob-report-${company.replace(/\s+/g, '-')}-${role.replace(/\s+/g, '-')}.txt`.toLowerCase();
    a.click();
    URL.revokeObjectURL(url);
  }

  const bobMood = overall >= 70 ? 'cheering' : overall >= 45 ? 'observing' : 'neutral';
  const bobMsg = overall >= 70
    ? `${overall}/100! Bob is impressed. Go get that internship.`
    : overall >= 45
    ? `${overall}/100. Solid start. A few things to refine.`
    : `${overall}/100. Bob has notes. Read them carefully.`;

  const observedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <Bob mood={bobMood} message={bobMsg} size={100} />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 900, fontSize: '2.75rem', color: '#1F3D2B', margin: 0, lineHeight: 1.05 }}>
            Bob's<br />Observations
          </h1>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: '#5A7060', marginTop: '0.5rem' }}>
            {company} · {role}
          </p>
        </div>
        {/* OBSERVED stamp */}
        <div style={{ flexShrink: 0 }}>
          <div className="stamp">{observedDate}</div>
          <div style={{ marginTop: '6px', textAlign: 'center' }}>
            <span className="stamp" style={{ fontSize: '0.75rem', padding: '1px 8px' }}>OBSERVED</span>
          </div>
          <div style={{ marginTop: '6px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', color: '#5A7060' }}>
            {mode === 'tough' ? '— tough mode —' : '— friendly mode —'}
          </div>
        </div>
      </div>

      {/* ── Score row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <div className="nb-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5A7060', marginBottom: '0.75rem' }}>Overall Score</div>
          <div style={{
            width: '5.5rem', height: '5.5rem', borderRadius: '50%',
            border: `4px solid ${scoreCircleColor(overall)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto',
            fontFamily: "'Fraunces', Georgia, serif", fontWeight: 900, fontSize: '2rem',
            color: scoreCircleColor(overall),
          }}>
            {overall}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#5A7060', marginTop: '0.5rem' }}>/100</div>
        </div>
        <div className="nb-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5A7060', marginBottom: '0.75rem' }}>Posting Fit</div>
          <div style={{
            width: '5.5rem', height: '5.5rem', borderRadius: '50%',
            border: `4px solid ${scoreCircleColor(fitScoreValue)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto',
            fontFamily: "'Fraunces', Georgia, serif", fontWeight: 900, fontSize: '2rem',
            color: scoreCircleColor(fitScoreValue),
          }}>
            {fitScoreValue}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#5A7060', marginTop: '0.5rem' }}>% match</div>
        </div>
      </div>

      {/* ── Metric badges ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '2rem' }}>
        {(Object.keys(METRIC_LABELS) as (keyof Metrics)[]).map(key => {
          const val = metrics[key];
          const rating = rateMetric(key, val);
          return (
            <div
              key={key}
              style={{
                background: RATING_BG[rating],
                border: `1.5px solid ${RATING_BORDER[rating]}`,
                borderRadius: '3px',
                padding: '0.75rem 0.5rem',
                textAlign: 'center',
                boxShadow: `2px 2px 0 ${RATING_BORDER[rating]}40`,
              }}
            >
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '1.125rem', color: RATING_TEXT[rating], lineHeight: 1 }}>
                {METRIC_FORMAT[key](val)}
              </div>
              <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 600, color: RATING_TEXT[rating], marginTop: '4px', letterSpacing: '0.04em' }}>
                {METRIC_LABELS[key]}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bob's Observations (ruled notebook page) ── */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 900, fontSize: '1.5rem', color: '#1F3D2B', marginBottom: '0.75rem' }}>
          Field Notes
        </h2>
        <div
          className="nb-card ruled"
          style={{ padding: '1.25rem 1.5rem', paddingTop: '1.5rem' }}
        >
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {observations.map((obs, i) => {
              // Determine rating from observation index for icon
              const metricKeys = Object.keys(METRIC_LABELS) as (keyof Metrics)[];
              const relKey = metricKeys[i];
              const rating = relKey ? rateMetric(relKey, metrics[relKey]) : 'okay';
              return (
                <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', lineHeight: 1.75 }}>
                  <RatingIcon rating={i < metricKeys.length ? rating : 'okay'} />
                  <span style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '1.1rem', color: '#1F3D2B', lineHeight: 1.6 }}>
                    {obs}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ── Answer Cards ── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 900, fontSize: '1.5rem', color: '#1F3D2B', margin: 0 }}>
            Answers
          </h2>
          {aiAvailable && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#F26B1D', letterSpacing: '0.06em', textTransform: 'uppercase', border: '1px solid #F26B1D', borderRadius: '2px', padding: '1px 6px' }}>
              AI Grader ready
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {answers.map((a, i) => (
            <AnswerCard
              key={i}
              answer={a}
              index={i}
              postingSkills={a.postingSkills ?? postingSkills}
              company={company}
              role={role}
              mode={a.mode ?? mode}
              aiAvailable={aiAvailable}
              onNotesChange={handleNotesChange}
            />
          ))}
        </div>
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button onClick={() => onSave(answers)} className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: 'center', minWidth: '160px' }}>
          <Save size={16} />
          Save to Field Log
        </button>
        <button onClick={handleCopyReport} className="btn btn-ghost btn-lg" style={{ flex: 1, justifyContent: 'center', minWidth: '160px' }}>
          <ClipboardCopy size={16} />
          {copied ? 'Copied!' : 'Copy Report'}
        </button>
        <button onClick={handleDownloadReport} className="btn btn-ghost btn-lg" style={{ flex: 1, justifyContent: 'center', minWidth: '160px' }}>
          <Download size={16} />
          Download .txt
        </button>
        <button onClick={onRestart} className="btn btn-ghost btn-lg" style={{ flex: 1, justifyContent: 'center', minWidth: '160px' }}>
          <RotateCcw size={16} />
          New Interview
        </button>
      </div>
    </div>
  );
}

