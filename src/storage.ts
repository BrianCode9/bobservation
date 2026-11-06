// storage.ts — type definitions + re-exports from db.ts
//
// All persistence now goes through IndexedDB (db.ts).
// This file keeps the type exports so the rest of the app doesn't need to change imports.

export interface SessionSummary {
  id: string;
  company: string;
  role: string;
  fitScore: number;
  overallScore: number;
  date: string; // ISO string
}

export interface FullSession extends SessionSummary {
  answers: AnswerRecord[];
  mode: 'friendly' | 'tough';
  postingSkills: string[];
  resumeSkills: string[];
  missingSkills: string[];
}

export interface AnswerRecord {
  question: string;
  transcript: string;
  metrics: Record<string, number>;
  /** timestamped events for answer replay */
  events?: ReplayEvent[];
  /** Blob URL for recorded video — in-memory only, lost on refresh */
  videoBlobUrl?: string;
  /** posting skills at interview time, for AI context */
  postingSkills?: string[];
  /** interview mode at answer time */
  mode?: 'friendly' | 'tough';
  /** user's personal notes on this answer, editable in Report */
  notes?: string;
}

/** A timestamped event logged during an answer for replay markers */
export interface ReplayEvent {
  offsetMs: number;   // ms from answer start
  type: 'looked-away' | 'filler' | 'long-pause' | 'nudge';
  label: string;
}

export interface QuestionHistoryEntry {
  question: string;
  company: string;
  role: string;
  date: string;
  score?: number;
}

// Re-export all async DB helpers under the same names
export {
  loadSessions,
  saveSession,
  getSession,
  deleteSession,
  loadQuestionHistory,
  saveQuestionHistory,
  appendQuestionsToHistory,
} from './db';
