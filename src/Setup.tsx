// Setup.tsx — field-notebook job posting + resume analysis, PDF upload, resume inference

import { useState, useRef } from 'react';
import { extractSkills, fitScore, pickQuestions } from './skills';
import { Bob } from './Bob';
import { Search, CheckCheck, AlertCircle, Binoculars, Flame, Leaf, Upload, Sparkles, Link, Loader, Camera, CameraOff, Clock, Hash, Gauge } from 'lucide-react';
import { inferFromResume } from './resumeInference';
import { generateQuestionsWithAI } from './answerGrader';
import { EE_QUESTION_BANK, SKILL_QUESTIONS } from './skills';

interface SetupProps {
  onStart: (config: {
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
  }) => void;
}

const S = {
  page: { maxWidth: '860px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' } as React.CSSProperties,
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' } as React.CSSProperties,
  fitBig: (n: number): React.CSSProperties => ({
    fontFamily: "'Fraunces', Georgia, serif",
    fontWeight: 900,
    fontSize: '3.5rem',
    lineHeight: 1,
    color: n >= 70 ? '#1d5c35' : n >= 40 ? '#b8860b' : '#C8462B',
  }),
};

// ── PDF extraction via pdfjs-dist ──────────────────────────────────────────────
async function extractTextFromPDF(file: File): Promise<string> {
  // ponytail: dynamic import to avoid bundling pdfjs worker into main chunk
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
  }
  return pages.join('\n');
}

// ── Job URL fetcher ───────────────────────────────────────────────────────────
/** Strip HTML tags and collapse whitespace to extract visible text */
function stripHTML(html: string): string {
  // Remove script / style / head blocks entirely
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '');
  // Replace block-level tags with newlines to preserve sentence breaks
  text = text.replace(/<\/(p|div|li|h[1-6]|br|tr|td|th|section|article)>/gi, '\n');
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
  // Collapse whitespace
  return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

/** Try to parse company + role from <title> tag */
function parseTitle(html: string): { company: string; role: string } | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return null;
  const title = stripHTML(match[1]).trim();
  // Common patterns: "Software Engineer at Acme", "Acme - Software Engineer", "Software Engineer | Acme Corp"
  const atMatch = title.match(/^(.+?)\s+at\s+(.+?)(?:\s*[|\-–—]|$)/i);
  if (atMatch) return { role: atMatch[1].trim(), company: atMatch[2].trim() };
  const dashMatch = title.match(/^(.+?)\s*[|\-–—]\s*(.+?)(?:\s*[|\-–—]|$)/);
  if (dashMatch) return { role: dashMatch[1].trim(), company: dashMatch[2].trim() };
  return null;
}

async function fetchJobURL(url: string): Promise<{ text: string; company: string; role: string }> {
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const resp = await fetch(proxy);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const json = await resp.json() as { contents: string };
  const html = json.contents ?? '';
  const text = stripHTML(html);
  const parsed = parseTitle(html);
  return {
    text: text.slice(0, 8000), // cap to avoid giant pastes
    company: parsed?.company ?? '',
    role: parsed?.role ?? '',
  };
}

export function Setup({ onStart }: SetupProps) {
  const [posting, setPosting] = useState('');
  const [resume, setResume] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [mode, setMode] = useState<'friendly' | 'tough'>('friendly');
  const [analyzed, setAnalyzed] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Job URL state
  const [jobUrl, setJobUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState('');

  // Advanced settings
  const [answerTimeLimitSecs, setAnswerTimeLimitSecs] = useState(120);
  const [questionCount, setQuestionCount] = useState(4);
  const [practiceMode, setPracticeMode] = useState(false);
  const [ttsRate, setTtsRate] = useState(0.95);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [starting, setStarting] = useState(false);

  const postingSkills = extractSkills(posting);
  const resumeSkills = extractSkills(resume);
  const resumeSkillSet = new Set(resumeSkills.map(s => s.toLowerCase()));
  const missingSkills = postingSkills.filter(s => !resumeSkillSet.has(s.toLowerCase()));
  const matchedSkills = postingSkills.filter(s => resumeSkillSet.has(s.toLowerCase()));
  const score = fitScore(postingSkills, resumeSkills);

  const inference = resume.trim().length > 50 ? inferFromResume(resume) : null;
  const suggestedRole = inference?.inferredRole ?? null;

  const bobMsg = !analyzed
    ? (inference ? inference.resumeSummary : 'Paste a job posting and your resume. Bob will find the skills.')
    : score >= 70
    ? `${score}% fit. Looking strong. Bob says go for it.`
    : score >= 40
    ? `${score}% fit. A few gaps — nothing you can't talk through.`
    : `${score}% fit. Tough match. A great interview changes that.`;

  async function handlePDFUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfLoading(true);
    setPdfError('');
    try {
      const text = await extractTextFromPDF(file);
      setResume(text);
      setAnalyzed(false);
    } catch (err) {
      setPdfError(`Could not read PDF: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleFetchURL() {
    const trimmed = jobUrl.trim();
    if (!trimmed) return;
    setUrlLoading(true);
    setUrlError('');
    try {
      const result = await fetchJobURL(trimmed);
      setPosting(result.text);
      setAnalyzed(false);
      if (result.company && !company) setCompany(result.company);
      if (result.role && !role) setRole(result.role);
    } catch (err) {
      setUrlError(`Couldn't fetch that URL: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUrlLoading(false);
    }
  }

  async function handleStart() {
    setStarting(true);
    // Skills in the posting that have no hardcoded questions in either bank
    const hasBank = (s: string) => !!(EE_QUESTION_BANK[s] || SKILL_QUESTIONS[s]);
    const uncoveredSkills = postingSkills.filter(s => !hasBank(s));

    let baseQuestions = pickQuestions(postingSkills, resumeSkills, questionCount);

    // If Claude is reachable and there are uncovered skills, generate fresh questions
    if (uncoveredSkills.length > 0 && import.meta.env.VITE_CLAUDE_API_KEY) {
      try {
        const aiQuestions = await generateQuestionsWithAI(
          uncoveredSkills,
          role || 'technical',
          company || '',
          3,
        );
        // Merge AI questions in, replacing behavioral fillers, up to questionCount
        const merged = [...aiQuestions, ...baseQuestions];
        const seen = new Set<string>();
        baseQuestions = merged.filter(q => {
          if (seen.has(q)) return false;
          seen.add(q);
          return true;
        }).slice(0, questionCount);
      } catch {
        // Claude unavailable — fall back to baseQuestions silently
      }
    }

    setStarting(false);
    onStart({
      company: company || 'Unknown Company',
      role: role || 'Unknown Role',
      postingSkills,
      resumeSkills,
      missingSkills,
      fitScoreValue: score,
      questions: baseQuestions,
      mode,
      answerTimeLimitSecs,
      questionCount,
      practiceMode,
      ttsRate,
    });
  }

  const timeLabel = answerTimeLimitSecs < 60
    ? `${answerTimeLimitSecs}s`
    : `${Math.floor(answerTimeLimitSecs / 60)}m${answerTimeLimitSecs % 60 ? ` ${answerTimeLimitSecs % 60}s` : ''}`;

  return (
    <div style={S.page}>

      {/* ── Page title + Bob ── */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <Bob mood={analyzed ? (score >= 70 ? 'cheering' : 'observing') : 'neutral'} message={bobMsg} size={110} />
        <div>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 900, fontSize: '3rem', color: '#1F3D2B', margin: 0, lineHeight: 1 }}>
            Observation<br />Setup
          </h1>
        </div>
      </div>

      {/* ── Job URL fetcher ── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label className="nb-label">Job Posting URL</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            className="nb-input"
            style={{ flex: 1 }}
            type="url"
            placeholder="https://jobs.example.com/posting/12345"
            value={jobUrl}
            onChange={e => setJobUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleFetchURL(); }}
          />
          <button
            type="button"
            onClick={handleFetchURL}
            disabled={urlLoading || !jobUrl.trim()}
            className="btn btn-ghost"
            style={{ flexShrink: 0, opacity: (!jobUrl.trim() || urlLoading) ? 0.5 : 1 }}
          >
            {urlLoading ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Link size={15} />}
            {urlLoading ? 'Fetching…' : 'Fetch'}
          </button>
        </div>
        {urlError && (
          <p style={{ margin: '4px 0 0', fontFamily: "'Instrument Sans', sans-serif", fontSize: '0.8rem', color: '#C8462B' }}>
            {urlError}
          </p>
        )}
        <p style={{ margin: '4px 0 0', fontFamily: "'Instrument Sans', sans-serif", fontSize: '0.75rem', color: '#5A7060' }}>
          Or paste the job description directly below ↓
        </p>
      </div>

      {/* ── Company + Role ── */}
      <div style={{ ...S.row2, marginBottom: '1.25rem' }}>
        <div>
          <label className="nb-label">Company</label>
          <input className="nb-input" placeholder="e.g. Acme Corp" value={company} onChange={e => setCompany(e.target.value)} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
            <label className="nb-label" style={{ margin: 0 }}>Role</label>
            {suggestedRole && !role && (
              <button
                type="button"
                onClick={() => setRole(suggestedRole)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, fontSize: '0.72rem',
                  color: '#F26B1D', padding: 0,
                }}
              >
                <Sparkles size={12} />
                Use "{suggestedRole}"
              </button>
            )}
          </div>
          <input className="nb-input" placeholder="e.g. Software Engineer Intern" value={role} onChange={e => setRole(e.target.value)} />
        </div>
      </div>

      {/* ── Posting + Resume ── */}
      <div style={{ ...S.row2, marginBottom: '1.25rem' }}>
        <div>
          <label className="nb-label">Job Posting</label>
          <textarea
            className="nb-input"
            style={{ height: '160px', resize: 'none', display: 'block', lineHeight: 1.5 }}
            placeholder="Paste the full job description here…"
            value={posting}
            onChange={e => { setPosting(e.target.value); setAnalyzed(false); }}
          />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
            <label className="nb-label" style={{ margin: 0 }}>Resume</label>
            {/* PDF upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={pdfLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'none', border: 'none', cursor: pdfLoading ? 'wait' : 'pointer',
                fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, fontSize: '0.75rem',
                color: '#F26B1D', padding: 0,
                opacity: pdfLoading ? 0.6 : 1,
              }}
            >
              <Upload size={13} />
              {pdfLoading ? 'Reading…' : 'Upload PDF'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={handlePDFUpload}
            />
          </div>
          <textarea
            className="nb-input"
            style={{ height: '160px', resize: 'none', display: 'block', lineHeight: 1.5 }}
            placeholder="Paste your resume text here, or upload a PDF above…"
            value={resume}
            onChange={e => { setResume(e.target.value); setAnalyzed(false); }}
          />
          {pdfError && (
            <p style={{ margin: '4px 0 0', fontFamily: "'Instrument Sans', sans-serif", fontSize: '0.8rem', color: '#C8462B' }}>
              {pdfError}
            </p>
          )}
        </div>
      </div>

      {/* ── Analyze button ── */}
      <button
        onClick={() => setAnalyzed(true)}
        disabled={!posting.trim()}
        className="btn btn-primary btn-full"
        style={{ marginBottom: '1.75rem', opacity: !posting.trim() ? 0.45 : 1 }}
      >
        <Search size={16} />
        Identify Skills
      </button>

      {/* ── Results ── */}
      {analyzed && postingSkills.length === 0 && (
        <div className="nb-card" style={{ padding: '1.25rem', display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <AlertCircle size={18} style={{ color: '#b8860b', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, color: '#5A7060', fontFamily: "'Instrument Sans', sans-serif" }}>
            Bob didn't find any known skills in that posting. Try pasting more of the description.
          </p>
        </div>
      )}

      {analyzed && postingSkills.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>

          {/* Fit score card */}
          {resume.trim() && (
            <div className="nb-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={S.fitBig(score)}>{score}%</div>
              <div>
                <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: '1.25rem', color: '#1F3D2B' }}>Fit Score</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: '#5A7060', marginTop: '4px' }}>
                  {matchedSkills.length} / {postingSkills.length} posting skills matched
                </div>
              </div>
            </div>
          )}

          {/* Posting skills */}
          <div>
            <span className="nb-label">Skills in posting ({postingSkills.length})</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '0.5rem' }}>
              {postingSkills.map(s => (
                <span key={s} className={`chip ${resumeSkillSet.has(s.toLowerCase()) ? 'chip-matched' : 'chip-missing'}`}>
                  {resumeSkillSet.has(s.toLowerCase()) ? <CheckCheck size={12} /> : <AlertCircle size={12} />}
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Missing skills */}
          {resume.trim() && missingSkills.length > 0 && (
            <div>
              <span className="nb-label" style={{ color: '#C8462B' }}>Missing from resume ({missingSkills.length})</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '0.5rem' }}>
                {missingSkills.map(s => (
                  <span key={s} className="chip chip-missing">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Resume inference panel ── */}
      {inference && (
        <div className="nb-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', borderLeft: '3px solid #F26B1D' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.625rem' }}>
            <Sparkles size={15} style={{ color: '#F26B1D', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: '0.9375rem', color: '#1F3D2B' }}>
              Bob's Resume Read
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem', color: '#5A7060',
              marginLeft: 'auto', letterSpacing: '0.04em',
            }}>
              {inference.confidence.toUpperCase()} CONFIDENCE
            </span>
          </div>

          {inference.inferredRole && (
            <div style={{ marginBottom: '0.5rem' }}>
              <span className="nb-label" style={{ display: 'inline', marginBottom: 0 }}>Inferred target role: </span>
              <span style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, color: '#1F3D2B' }}>
                {inference.inferredRole}
              </span>
            </div>
          )}

          {inference.suggestedGaps.length > 0 && (
            <div style={{ marginBottom: '0.5rem' }}>
              <span className="nb-label">Skills commonly expected for this role that Bob didn't see:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '0.375rem' }}>
                {inference.suggestedGaps.map(s => (
                  <span key={s} className="chip chip-missing" style={{ fontSize: '0.75rem' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          <p style={{ fontFamily: "'Caveat', cursive", fontSize: '1rem', color: '#5A7060', margin: 0, lineHeight: 1.5 }}>
            {inference.resumeSummary}
          </p>
        </div>
      )}

      {/* ── Mode toggle ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <span className="nb-label" style={{ marginBottom: 0 }}>Interview mode</span>
        <button
          onClick={() => setMode('friendly')}
          className="btn"
          style={{
            background: mode === 'friendly' ? '#eaf5ee' : 'transparent',
            color: mode === 'friendly' ? '#1d5c35' : '#5A7060',
            borderColor: mode === 'friendly' ? '#3a7d54' : '#D9CFBF',
            boxShadow: mode === 'friendly' ? '2px 2px 0 #3a7d54' : '2px 2px 0 #D9CFBF',
          }}
        >
          <Leaf size={15} />
          Friendly
        </button>
        <button
          onClick={() => setMode('tough')}
          className="btn"
          style={{
            background: mode === 'tough' ? '#fdf1ef' : 'transparent',
            color: mode === 'tough' ? '#C8462B' : '#5A7060',
            borderColor: mode === 'tough' ? '#C8462B' : '#D9CFBF',
            boxShadow: mode === 'tough' ? '2px 2px 0 #9a2e1c' : '2px 2px 0 #D9CFBF',
          }}
        >
          <Flame size={15} />
          Tough
        </button>

        {/* Practice mode toggle */}
        <button
          onClick={() => setPracticeMode(p => !p)}
          className="btn"
          style={{
            marginLeft: 'auto',
            background: practiceMode ? '#f5f0fd' : 'transparent',
            color: practiceMode ? '#6d40c4' : '#5A7060',
            borderColor: practiceMode ? '#6d40c4' : '#D9CFBF',
            boxShadow: practiceMode ? '2px 2px 0 #4e2e8e' : '2px 2px 0 #D9CFBF',
          }}
        >
          {practiceMode ? <CameraOff size={15} /> : <Camera size={15} />}
          {practiceMode ? 'No Camera' : 'With Camera'}
        </button>
      </div>

      {/* ── Advanced settings ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, fontSize: '0.8125rem',
            color: '#5A7060', letterSpacing: '0.03em',
          }}
        >
          <Gauge size={13} />
          {showAdvanced ? 'Hide' : 'Show'} advanced settings
        </button>

        {showAdvanced && (
          <div className="nb-card" style={{ padding: '1rem 1.25rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Answer time limit */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <label className="nb-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={12} /> Answer Time Limit
                </label>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: '#F26B1D', fontWeight: 700 }}>
                  {timeLabel}
                </span>
              </div>
              <input
                type="range"
                min={30}
                max={300}
                step={30}
                value={answerTimeLimitSecs}
                onChange={e => setAnswerTimeLimitSecs(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#F26B1D' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#5A7060' }}>
                <span>30s</span><span>5m</span>
              </div>
            </div>

            {/* Question count */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <label className="nb-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Hash size={12} /> Questions
                </label>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: '#F26B1D', fontWeight: 700 }}>
                  {questionCount}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={questionCount}
                onChange={e => setQuestionCount(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#F26B1D' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#5A7060' }}>
                <span>1</span><span>8</span>
              </div>
            </div>

            {/* TTS rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <label className="nb-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  Bob Voice Speed
                </label>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: '#F26B1D', fontWeight: 700 }}>
                  {ttsRate.toFixed(2)}×
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.05}
                value={ttsRate}
                onChange={e => setTtsRate(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#F26B1D' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#5A7060' }}>
                <span>Slow</span><span>Fast</span>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── Start button ── */}
      <button onClick={handleStart} disabled={starting} className="btn btn-accent btn-full btn-lg" style={{ opacity: starting ? 0.7 : 1 }}>
        {starting
          ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Bob is generating questions…</>
          : <><Binoculars size={18} /> Begin Observation</>
        }
      </button>
    </div>
  );
}
