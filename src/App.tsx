// App.tsx — View switching: dashboard, setup, interview, report, profile

import { useState } from 'react';
import { Setup } from './Setup';
import { Interview } from './Interview';
import { Report } from './Report';
import { Dashboard } from './Dashboard';
import { Profile } from './Profile';
import { Bob } from './Bob';
import type { AnswerRecord, FullSession } from './storage';
import { saveSession, appendQuestionsToHistory } from './storage';
import { overallScore } from './metrics';
import type { Metrics } from './metrics';
import { Binoculars, BookOpen, Home, UserCircle } from 'lucide-react';

type View = 'dashboard' | 'setup' | 'interview' | 'report' | 'profile';

interface SessionConfig {
  company: string;
  role: string;
  postingSkills: string[];
  resumeSkills: string[];
  missingSkills: string[];
  fitScoreValue: number;
  questions: string[];
  mode: 'friendly' | 'tough';
  answerTimeLimitSecs: number;
  questionCount: number;
  practiceMode: boolean;
  ttsRate: number;
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

// Nav item definition
const NAV_ITEMS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',  label: 'Field Log',      icon: <Home size={15} /> },
  { id: 'setup',      label: 'New Interview',  icon: <Binoculars size={15} /> },
  { id: 'profile',    label: 'Profile',        icon: <UserCircle size={15} /> },
];

// Active-state includes adjacent views (interview → setup active, report → setup active)
function navActive(navId: View, currentView: View): boolean {
  if (navId === 'setup') return currentView === 'setup' || currentView === 'interview' || currentView === 'report';
  return navId === currentView;
}

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [config, setConfig] = useState<SessionConfig | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [pendingSessionId] = useState<string>(() => crypto.randomUUID());

  function handleSetupStart(cfg: SessionConfig) {
    setConfig(cfg);
    setAnswers([]);
    setView('interview');
  }

  function handleInterviewDone(completedAnswers: AnswerRecord[]) {
    setAnswers(completedAnswers);
    setView('report');
  }

  async function handleSaveSession(updatedAnswers?: AnswerRecord[]) {
    if (!config) return;
    const finalAnswers = updatedAnswers ?? answers;
    const metrics = averageMetrics(finalAnswers);
    const score = overallScore(metrics);
    const session: FullSession = {
      id: pendingSessionId,
      company: config.company,
      role: config.role,
      fitScore: config.fitScoreValue,
      overallScore: score,
      date: new Date().toISOString(),
      answers: finalAnswers,
      mode: config.mode,
      postingSkills: config.postingSkills,
      resumeSkills: config.resumeSkills,
      missingSkills: config.missingSkills,
    };
    await saveSession(session);
    await appendQuestionsToHistory(finalAnswers, config.company, config.role, score);
    setView('dashboard');
  }

  function handleOpenSession(session: FullSession) {
    setAnswers(session.answers);
    setConfig({
      company: session.company,
      role: session.role,
      postingSkills: session.postingSkills,
      resumeSkills: session.resumeSkills,
      missingSkills: session.missingSkills,
      fitScoreValue: session.fitScore,
      questions: session.answers.map(a => a.question),
      mode: session.mode,
      answerTimeLimitSecs: 120,
      questionCount: session.answers.length,
      practiceMode: false,
      ttsRate: 0.95,
    });
    setView('report');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F6F1E7' }}>

      {/* ── Header ── */}
      <header style={{
        background: '#1F3D2B',
        borderBottom: '2px solid #162d1f',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1024px', margin: '0 auto', padding: '0 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '60px',
        }}>
          {/* Logo */}
          <button
            onClick={() => setView('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Bob mood="neutral" size={34} />
            <span style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontWeight: 900, fontSize: '1.4rem', color: '#F6F1E7',
              letterSpacing: '-0.02em',
            }}>
              Bobservation
            </span>
          </button>

          {/* Nav tabs */}
          <nav style={{ display: 'flex', gap: '4px' }}>
            {NAV_ITEMS.map(item => {
              const active = navActive(item.id, view);
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: active ? 'rgba(242,107,29,0.18)' : 'transparent',
                    color: active ? '#FFE066' : 'rgba(246,241,231,0.75)',
                    border: `1.5px solid ${active ? '#F26B1D' : 'rgba(246,241,231,0.2)'}`,
                    borderRadius: '3px',
                    padding: '6px 14px',
                    fontSize: '0.875rem',
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.1s, color 0.1s',
                    letterSpacing: '0.01em',
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ paddingBottom: '4rem' }}>
        {view === 'dashboard' && (
          <Dashboard onOpenSession={handleOpenSession} onNewInterview={() => setView('setup')} />
        )}
        {view === 'setup' && (
          <Setup onStart={handleSetupStart} />
        )}
        {view === 'interview' && config && (
          <Interview
            questions={config.questions}
            postingSkills={config.postingSkills}
            mode={config.mode}
            answerTimeLimitSecs={config.answerTimeLimitSecs}
            practiceMode={config.practiceMode}
            ttsRate={config.ttsRate}
            onDone={handleInterviewDone}
            onCancel={() => setView('setup')}
          />
        )}
        {view === 'report' && config && (
          <Report
            answers={answers}
            mode={config.mode}
            postingSkills={config.postingSkills}
            fitScoreValue={config.fitScoreValue}
            company={config.company}
            role={config.role}
            onSave={(updatedAnswers) => handleSaveSession(updatedAnswers)}
            onRestart={() => setView('setup')}
          />
        )}
        {view === 'profile' && (
          <Profile />
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(246,241,231,0.92)',
        backdropFilter: 'blur(6px)',
        borderTop: '1px solid #D9CFBF',
        padding: '6px 0',
        textAlign: 'center',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.6875rem',
        color: '#5A7060',
        letterSpacing: '0.04em',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      }}>
        <BookOpen size={12} style={{ color: '#5A7060' }} />
        Everything runs in the browser. The video never leaves your laptop. No paid APIs.
      </footer>
    </div>
  );
}

