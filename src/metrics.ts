// metrics.ts — pure functions: landmarks + words → metrics

export interface FaceFrame {
  yaw: number;   // head yaw in degrees
  pitch: number; // head pitch in degrees
  eyeLookMax: number;  // max of all eyeLook* blendshapes
  smileLeft: number;   // mouthSmileLeft
  smileRight: number;  // mouthSmileRight
  noseTipX: number;
  noseTipY: number;
}

export interface MetricsInput {
  frames: FaceFrame[];
  transcript: string;
  speakingSeconds: number; // total non-pause seconds
  longPauseCount: number;  // pauses > 2s
}

export interface Metrics {
  eyeContactPct: number;  // 0–100
  headMovement: number;   // avg frame-to-frame nose movement
  smilePct: number;       // pct of frames with smile > 0.4
  fillersPerMin: number;
  wordsPerMin: number;
  longPauses: number;
  starKeywords: number;   // 0–4
}

const FILLERS = ['um', 'uh', 'like', 'you know', 'basically', 'kind of'];
const STAR_PATTERNS = [
  /\b(situation|context|background)\b/i,
  /\b(my task|my role|i (was |had to |needed to))\b/i,
  /\b(i (built|did|created|developed|wrote|implemented|solved|fixed|made))\b/i,
  /(\d+\s*%|\d+ percent|\bresult\b|\boutcome\b|\bimproved\b|\bincreased\b|\breduced\b)/i,
];

export function computeMetrics(input: MetricsInput): Metrics {
  const { frames, transcript, speakingSeconds, longPauseCount } = input;
  const totalFrames = frames.length;

  // Eye contact: head yaw < 15°, pitch < 12°, eyeLookMax < 0.5
  const eyeContactFrames = frames.filter(
    f => Math.abs(f.yaw) < 15 && Math.abs(f.pitch) < 12 && f.eyeLookMax < 0.5
  ).length;
  const eyeContactPct = totalFrames > 0 ? Math.round((eyeContactFrames / totalFrames) * 100) : 0;

  // Head movement: avg frame-to-frame nose tip distance
  let totalMovement = 0;
  for (let i = 1; i < frames.length; i++) {
    const dx = frames[i].noseTipX - frames[i - 1].noseTipX;
    const dy = frames[i].noseTipY - frames[i - 1].noseTipY;
    totalMovement += Math.sqrt(dx * dx + dy * dy);
  }
  const headMovement = frames.length > 1 ? totalMovement / (frames.length - 1) : 0;

  // Smile: pct of frames where avg(smileLeft, smileRight) > 0.4
  const smilingFrames = frames.filter(f => (f.smileLeft + f.smileRight) / 2 > 0.4).length;
  const smilePct = totalFrames > 0 ? Math.round((smilingFrames / totalFrames) * 100) : 0;

  // Fillers per minute
  const words = transcript.toLowerCase();
  let fillerCount = 0;
  for (const filler of FILLERS) {
    const re = new RegExp(`\\b${filler.replace(' ', '\\s+')}\\b`, 'gi');
    const matches = words.match(re);
    if (matches) fillerCount += matches.length;
  }
  const totalMinutes = speakingSeconds / 60;
  const fillersPerMin = totalMinutes > 0 ? Math.round((fillerCount / totalMinutes) * 10) / 10 : 0;

  // Words per minute
  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
  const wordsPerMin = speakingSeconds > 0 ? Math.round((wordCount / speakingSeconds) * 60) : 0;

  // STAR keywords
  let starKeywords = 0;
  for (const pat of STAR_PATTERNS) {
    if (pat.test(transcript)) starKeywords++;
  }

  return {
    eyeContactPct,
    headMovement,
    smilePct,
    fillersPerMin,
    wordsPerMin,
    longPauses: longPauseCount,
    starKeywords,
  };
}

export type Rating = 'good' | 'okay' | 'needs work';

export function rateMetric(key: keyof Metrics, value: number): Rating {
  switch (key) {
    case 'eyeContactPct':
      return value >= 70 ? 'good' : value >= 50 ? 'okay' : 'needs work';
    case 'headMovement':
      return value < 0.004 ? 'good' : value <= 0.01 ? 'okay' : 'needs work';
    case 'smilePct':
      return value >= 15 ? 'good' : value >= 5 ? 'okay' : 'needs work';
    case 'fillersPerMin':
      return value < 3 ? 'good' : value <= 6 ? 'okay' : 'needs work';
    case 'wordsPerMin':
      return value >= 120 && value <= 160 ? 'good' : (value >= 100 && value <= 180) ? 'okay' : 'needs work';
    case 'longPauses':
      return value <= 1 ? 'good' : value <= 3 ? 'okay' : 'needs work';
    case 'starKeywords':
      return value === 4 ? 'good' : value === 3 ? 'okay' : 'needs work';
    default:
      return 'okay';
  }
}

export function ratingScore(r: Rating): number {
  return r === 'good' ? 100 : r === 'okay' ? 60 : 25;
}

export function overallScore(metrics: Metrics): number {
  const keys = Object.keys(metrics) as (keyof Metrics)[];
  const total = keys.reduce((sum, k) => sum + ratingScore(rateMetric(k, metrics[k])), 0);
  return Math.round(total / keys.length);
}
