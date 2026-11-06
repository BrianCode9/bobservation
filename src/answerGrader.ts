// answerGrader.ts — deep rule-based content scoring + window.ai (Gemini Nano) grading

// ── Rule-based content scoring ────────────────────────────────────────────────

export interface ContentScore {
  // 0–100 each
  specificity: number;   // concrete details, numbers, names
  depth: number;         // length and elaboration relative to question type
  relevance: number;     // mentions question keywords + posting skills
  structure: number;     // STAR structure (enhanced)
  clarity: number;       // sentence complexity, hedging language
  // Overall 0–100
  total: number;
  // Bob's written grade
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  // Actionable tips (up to 3)
  tips: string[];
}

// Weak openers that lower specificity
const WEAK_PHRASES = [
  'i would', "i'd probably", 'i think maybe', 'sort of', 'kind of', 'i guess',
  'something like that', 'you know what i mean', 'and stuff', 'etcetera',
  'things like that', 'basically what happened', 'like literally',
];

// Power verbs that raise specificity
const POWER_VERBS = [
  'built', 'designed', 'led', 'reduced', 'increased', 'improved', 'launched',
  'implemented', 'created', 'delivered', 'automated', 'optimized', 'refactored',
  'deployed', 'architected', 'negotiated', 'presented', 'mentored', 'shipped',
  'migrated', 'integrated', 'resolved', 'collaborated',
];

// STAR: each element now has multiple patterns
const STAR_CHECKS = {
  situation: [
    /\b(situation|context|background|at the time|back when|working on|we were|the project|the team)\b/i,
  ],
  task: [
    /\b(my (task|role|job|responsibility)|i (was (asked|assigned|responsible)|had to|needed to)|the goal was|we needed to)\b/i,
  ],
  action: [
    /\b(i (built|wrote|created|implemented|designed|led|launched|fixed|solved|developed|worked on|decided|reached out|talked to|set up|automated|refactored|shipped|deployed))\b/i,
    /\b(what i did was|my approach|i started|i first|i then|i ended up)\b/i,
  ],
  result: [
    /(\d+\s*%|\d[\d,]* (users|customers|requests|tickets|bugs|hours|days|seconds|dollars|ms|points))/i,
    /\b(as a result|the result was|which (led|resulted) to|we (achieved|shipped|delivered|reduced|increased|improved|saved))\b/i,
    /\b(outcome|impact|in the end|ultimately|this (helped|allowed|meant))\b/i,
  ],
};

function countSTAR(text: string): { s: boolean; t: boolean; a: boolean; r: boolean; total: number } {
  const s = STAR_CHECKS.situation.some(p => p.test(text));
  const t = STAR_CHECKS.task.some(p => p.test(text));
  const a = STAR_CHECKS.action.some(p => p.test(text));
  const r = STAR_CHECKS.result.some(p => p.test(text));
  return { s, t, a, r, total: [s, t, a, r].filter(Boolean).length };
}

function countNumbers(text: string): number {
  return (text.match(/\b\d[\d,.]*\b/g) ?? []).length;
}

function countPowerVerbs(text: string): number {
  const lower = text.toLowerCase();
  return POWER_VERBS.filter(v => lower.includes(v)).length;
}

function countWeakPhrases(text: string): number {
  const lower = text.toLowerCase();
  return WEAK_PHRASES.filter(p => lower.includes(p)).length;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function avgSentenceLength(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3);
  if (sentences.length === 0) return 0;
  return sentences.reduce((s, sent) => s + sent.split(/\s+/).filter(Boolean).length, 0) / sentences.length;
}

export function gradeAnswerContent(
  transcript: string,
  question: string,
  postingSkills: string[],
): ContentScore {
  const words = wordCount(transcript);
  const lower = transcript.toLowerCase();
  const questionLower = question.toLowerCase();

  // ── Specificity (0–100) ──────────────────────────────────────────────────
  const numbers = countNumbers(transcript);
  const powerVerbs = countPowerVerbs(transcript);
  const weakPhrases = countWeakPhrases(transcript);
  let specificity = 50;
  specificity += Math.min(numbers * 10, 30);
  specificity += Math.min(powerVerbs * 8, 24);
  specificity -= Math.min(weakPhrases * 12, 36);
  specificity = Math.max(0, Math.min(100, specificity));

  // ── Depth (0–100) — length relative to expected ─────────────────────────
  // Behavioral questions expect 80–200 words; too short or rambling penalised
  let depth = 50;
  if (words < 20)       depth = 10;
  else if (words < 50)  depth = 30;
  else if (words < 80)  depth = 50;
  else if (words <= 180) depth = 85 + Math.min((words - 80) / 100 * 15, 15);
  else if (words <= 250) depth = 85;
  else                   depth = Math.max(40, 85 - (words - 250) * 0.3); // penalise rambling

  // ── Relevance (0–100) ──────────────────────────────────────────────────
  // Extract key nouns from question, check they appear in answer
  const questionWords = questionLower.split(/\W+/).filter(w => w.length > 4);
  const questionHits = questionWords.filter(w => lower.includes(w)).length;
  const questionRelevance = questionWords.length > 0
    ? Math.round((questionHits / questionWords.length) * 60)
    : 40;
  // Posting skill mentions
  const skillHits = postingSkills.filter(s => lower.includes(s.toLowerCase())).length;
  const skillRelevance = postingSkills.length > 0 ? Math.min(skillHits * 10, 40) : 20;
  const relevance = Math.min(100, questionRelevance + skillRelevance);

  // ── Structure (0–100) — enhanced STAR ────────────────────────────────────
  const star = countSTAR(transcript);
  const structure = Math.round((star.total / 4) * 100);

  // ── Clarity (0–100) ───────────────────────────────────────────────────
  const avgSentLen = avgSentenceLength(transcript);
  let clarity = 80;
  // Ideal sentence length 12–20 words
  if (avgSentLen > 35)       clarity = 40;
  else if (avgSentLen > 25)  clarity = 60;
  else if (avgSentLen < 5 && words > 20) clarity = 60;
  clarity -= Math.min(weakPhrases * 5, 20);
  clarity = Math.max(0, Math.min(100, clarity));

  // ── Total ─────────────────────────────────────────────────────────────
  const total = Math.round(
    specificity * 0.25 +
    depth       * 0.20 +
    relevance   * 0.20 +
    structure   * 0.25 +
    clarity     * 0.10
  );

  // ── Grade ─────────────────────────────────────────────────────────────
  const grade = total >= 85 ? 'A' : total >= 70 ? 'B' : total >= 55 ? 'C' : total >= 40 ? 'D' : 'F';

  // ── Tips (up to 3, most impactful first) ─────────────────────────────
  const tips: string[] = [];

  if (structure < 50 && !star.r) {
    tips.push("Bob didn't hear a Result. Add a number — 'reduced load time by 40%' beats 'it got faster'.");
  }
  if (structure < 50 && !star.s) {
    tips.push("Set the scene. Start with 'The situation was…' so the interviewer knows the context.");
  }
  if (specificity < 50 && numbers === 0) {
    tips.push("Zero numbers in that answer. Quantify something — team size, time saved, % improvement.");
  }
  if (depth < 40) {
    tips.push(`Only ${words} words — too short. Aim for 80–180 words per answer.`);
  }
  if (depth > 80 && words > 220) {
    tips.push(`${words} words — a bit long. Cut it to the strongest 150.`);
  }
  if (weakPhrases > 2) {
    tips.push(`Bob heard "${WEAK_PHRASES.find(p => lower.includes(p))}" — replace hedging language with confident statements.`);
  }
  if (powerVerbs === 0 && words > 30) {
    tips.push("Use strong action verbs: built, led, reduced, shipped — not 'helped with' or 'was involved in'.");
  }

  return { specificity, depth, relevance, structure, clarity, total, grade, tips: tips.slice(0, 3) };
}

// ── AI grading via Claude (Anthropic) ─────────────────────────────────────────
// Routed through the Vite dev-server proxy at /api/claude so the key never
// touches the browser bundle. See vite.config.ts server.proxy.

export async function checkAIAvailable(): Promise<boolean> {
  // Available whenever the Vite proxy is running (i.e. in dev mode)
  return import.meta.env.DEV && !!import.meta.env.VITE_CLAUDE_API_KEY;
}

export async function gradeWithAI(
  transcript: string,
  question: string,
  postingSkills: string[],
  mode: 'friendly' | 'tough',
): Promise<string> {
  const skillsStr = postingSkills.length > 0 ? postingSkills.slice(0, 6).join(', ') : 'not specified';
  const tone = mode === 'tough'
    ? 'Be direct and critical. No padding.'
    : 'Be encouraging but honest.';

  const systemPrompt = `You are Bob, an AI interview coach robot. You give concise, specific feedback on mock interview answers.
Speak in third person as Bob: "Bob noticed...", "Bob thinks...", "Bob wants to see...".
${tone}
Keep feedback to 3 sentences maximum. Always end with one concrete actionable tip starting with "Bob recommends:".`;

  const userPrompt = `Question: "${question}"
Posting skills to mention: ${skillsStr}

Candidate's answer:
"${transcript}"

Grade this answer (A/B/C/D/F) and give Bob's feedback in exactly 3 sentences.`;

  const resp = await fetch('/api/claude/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 256,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Claude API ${resp.status}: ${err}`);
  }

  const json = await resp.json() as { content: { type: string; text: string }[] };
  return json.content.find(b => b.type === 'text')?.text ?? 'Bob had nothing to say.';
}

// ── AI question generation via Claude ─────────────────────────────────────────
// Called from Setup when posting skills have no hardcoded questions in the bank.

/** Ask Claude to generate interview questions for skills we have no bank entries for.
 *  Returns a flat list of question strings (2 per skill, up to maxSkills skills). */
export async function generateQuestionsWithAI(
  skills: string[],
  role: string,
  company: string,
  maxSkills = 4,
): Promise<string[]> {
  if (skills.length === 0) return [];

  const targetSkills = skills.slice(0, maxSkills);

  const prompt = `You are generating mock interview questions for a candidate applying for a ${role || 'technical'} role${company ? ` at ${company}` : ''}.

For each of the following skills, write exactly 2 strong behavioral/technical interview questions in STAR format. The questions should be specific, realistic, and appropriate for an internship or new-grad candidate.

Skills: ${targetSkills.join(', ')}

Respond with ONLY a JSON array of question strings, no other text. Example format:
["Question 1?", "Question 2?", "Question 3?", "Question 4?"]`;

  const resp = await fetch('/api/claude/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Claude API ${resp.status}: ${err}`);
  }

  const json = await resp.json() as { content: { type: string; text: string }[] };
  const text = json.content.find(b => b.type === 'text')?.text ?? '[]';

  // Parse the JSON array out of the response (Claude may add markdown fences)
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const questions = JSON.parse(match[0]) as string[];
    return questions.filter(q => typeof q === 'string' && q.trim().length > 0);
  } catch {
    return [];
  }
}
