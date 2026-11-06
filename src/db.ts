// db.ts — IndexedDB via idb. Single source of truth replacing localStorage.
//
// Stores:
//   sessions        — FullSession objects (keyed by id)
//   questionHistory — QuestionHistoryEntry[] (single record, key 'all')
//   profile         — UserProfile (single record, key 'profile')
//
// Migration: on first open, any existing localStorage data is copied in and
// the localStorage keys are removed so we don't double-read.

import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import type { FullSession, QuestionHistoryEntry } from './storage';
import type { UserProfile } from './userProfile';

const DB_NAME = 'bobservation';
const DB_VERSION = 1;

// ── Open (cached) ──────────────────────────────────────────────────────────────
let _db: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('questionHistory')) {
        db.createObjectStore('questionHistory');
      }
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile');
      }
    },
  });
  await migrateFromLocalStorage(_db);
  return _db;
}

// ── Migration ──────────────────────────────────────────────────────────────────
const LS_SESSIONS_KEY  = 'bobservation_sessions';
const LS_HISTORY_KEY   = 'bobservation_question_history';
const LS_PROFILE_KEY   = 'bobservation_profile';
const LS_MIGRATED_FLAG = 'bobservation_idb_migrated';

async function migrateFromLocalStorage(db: IDBPDatabase): Promise<void> {
  if (localStorage.getItem(LS_MIGRATED_FLAG)) return;

  try {
    // Sessions
    const rawSessions = localStorage.getItem(LS_SESSIONS_KEY);
    if (rawSessions) {
      const sessions: FullSession[] = JSON.parse(rawSessions);
      const tx = db.transaction('sessions', 'readwrite');
      for (const s of sessions) await tx.store.put(s);
      await tx.done;
    }

    // Question history
    const rawHistory = localStorage.getItem(LS_HISTORY_KEY);
    if (rawHistory) {
      const history: QuestionHistoryEntry[] = JSON.parse(rawHistory);
      await db.put('questionHistory', history, 'all');
    }

    // Profile
    const rawProfile = localStorage.getItem(LS_PROFILE_KEY);
    if (rawProfile) {
      const profile: UserProfile = JSON.parse(rawProfile);
      await db.put('profile', profile, 'profile');
    }
  } catch (e) {
    console.warn('Bobservation: localStorage migration failed', e);
  }

  // Mark done and clean up old keys
  localStorage.setItem(LS_MIGRATED_FLAG, '1');
  localStorage.removeItem(LS_SESSIONS_KEY);
  localStorage.removeItem(LS_HISTORY_KEY);
  localStorage.removeItem(LS_PROFILE_KEY);
}

// ── Sessions ───────────────────────────────────────────────────────────────────

export async function loadSessions(): Promise<FullSession[]> {
  const db = await getDB();
  const all = await db.getAll('sessions') as FullSession[];
  // Sort newest first
  return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function saveSession(session: FullSession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function getSession(id: string): Promise<FullSession | undefined> {
  const db = await getDB();
  return db.get('sessions', id);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', id);
}

// ── Question history ───────────────────────────────────────────────────────────

export async function loadQuestionHistory(): Promise<QuestionHistoryEntry[]> {
  const db = await getDB();
  return (await db.get('questionHistory', 'all')) ?? [];
}

export async function saveQuestionHistory(entries: QuestionHistoryEntry[]): Promise<void> {
  const db = await getDB();
  await db.put('questionHistory', entries, 'all');
}

export async function appendQuestionsToHistory(
  answers: import('./storage').AnswerRecord[],
  company: string,
  role: string,
  overallSessionScore: number,
): Promise<void> {
  const existing = await loadQuestionHistory();
  const existingQs = new Set(existing.map(e => e.question));
  const date = new Date().toISOString();
  const newEntries: QuestionHistoryEntry[] = answers
    .filter(a => !existingQs.has(a.question))
    .map(a => ({ question: a.question, company, role, date, score: overallSessionScore }));
  await saveQuestionHistory([...newEntries, ...existing].slice(0, 500));
}

// ── Profile ────────────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: UserProfile = { name: '', targetRole: '', likedQuestions: [] };

export async function loadProfile(): Promise<UserProfile> {
  const db = await getDB();
  const stored = await db.get('profile', 'profile');
  return { ...DEFAULT_PROFILE, ...(stored ?? {}) };
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const db = await getDB();
  await db.put('profile', profile, 'profile');
}

export async function updateProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
  const current = await loadProfile();
  const updated = { ...current, ...patch };
  await saveProfile(updated);
  return updated;
}

export async function likeQuestion(question: string, company: string, role: string): Promise<void> {
  const profile = await loadProfile();
  if (profile.likedQuestions.some(q => q.question === question)) return;
  profile.likedQuestions = [
    { question, company, role, likedAt: new Date().toISOString() },
    ...profile.likedQuestions,
  ].slice(0, 200);
  await saveProfile(profile);
}

export async function unlikeQuestion(question: string): Promise<void> {
  const profile = await loadProfile();
  profile.likedQuestions = profile.likedQuestions.filter(q => q.question !== question);
  await saveProfile(profile);
}

export async function isQuestionLiked(question: string): Promise<boolean> {
  const profile = await loadProfile();
  return profile.likedQuestions.some(q => q.question === question);
}
