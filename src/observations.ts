// observations.ts — rule-based Bob feedback templates

import type { Metrics, Rating } from './metrics';
import { rateMetric } from './metrics';

type Mode = 'friendly' | 'tough';

interface Template {
  good: (value: number) => string;
  okay: (value: number) => string;
  'needs work': (value: number) => string;
}

const TEMPLATES: Record<keyof Metrics, Template> = {
  eyeContactPct: {
    good:  (v) => `Bob noticed ${v}% eye contact. Bob is impressed. You looked right at the camera like a pro.`,
    okay:  (v) => `Bob saw ${v}% eye contact. Not bad! Try to glance at the camera a bit more.`,
    'needs work': (v) => `Eye contact ${v}%. Look at the camera, not the ceiling. The interviewer is right there.`,
  },
  headMovement: {
    good:  (_v) => `Bob observed very steady head movement. You looked calm and in control.`,
    okay:  (_v) => `Your head moved a little. Try to stay still — it reads as nervousness on camera.`,
    'needs work': (_v) => `Your head was moving quite a bit. Plant your feet and keep still. It distracts the interviewer.`,
  },
  smilePct: {
    good:  (v) => `Bob noticed you smiled ${v}% of the time. That warmth comes through. Keep it.`,
    okay:  (v) => `Bob spotted a few smiles (${v}% of frames). A little more energy would help.`,
    'needs work': (v) => `Smiling ${v}% of the time. Bob believes you're a fun person. Let it show.`,
  },
  fillersPerMin: {
    good:  (v) => `Only ${v} filler words per minute. Clean and confident. Bob approves.`,
    okay:  (v) => `Bob counted ${v} fillers per minute. A few "ums" crept in. Try a silent pause instead.`,
    'needs work': (v) => `${v} filler words per minute. An interviewer will notice. Replace "um" with silence.`,
  },
  wordsPerMin: {
    good:  (v) => `${v} words per minute — right in the sweet spot. Your pacing is excellent.`,
    okay:  (v) => `${v} words per minute. ${v > 160 ? 'Slow down a little.' : 'Try to pick up the pace slightly.'}`,
    'needs work': (v) => `${v} words per minute. ${v > 180 ? 'You\'re rushing. Breathe.' : 'You need to speak up and fill the silence.'}`,
  },
  longPauses: {
    good:  (v) => `${v} long pause${v === 1 ? '' : 's'}. Bob approves of the crisp delivery.`,
    okay:  (v) => `${v} long pause${v === 1 ? '' : 's'} detected. It happens. Bridge them with "what I mean is…".`,
    'needs work': (v) => `${v} long pause${v === 1 ? '' : 's'}. Too much dead air. Know your stories before the call.`,
  },
  starKeywords: {
    good:  (_v) => `Bob heard a clear Situation, Task, Action, and Result. Textbook STAR answer.`,
    okay:  (_v) => `Bob caught most of the STAR structure. Just one piece is missing — make it explicit.`,
    'needs work': (_v) => `Bob is still waiting to hear the full story. Use Situation → Task → Action → Result. Add a number to the ending.`,
  },
};

const TOUGH_OVERRIDES: Partial<Record<keyof Metrics, Template>> = {
  eyeContactPct: {
    good:  (v) => `${v}% eye contact. Solid.`,
    okay:  (v) => `${v}% eye contact. Needs work. Look at the camera.`,
    'needs work': (v) => `${v}% eye contact. You're talking to the wall.`,
  },
  fillersPerMin: {
    good:  (v) => `${v} fillers per minute. Clean.`,
    okay:  (v) => `${v} fillers per minute. Cut them.`,
    'needs work': (v) => `${v} filler words per minute. An interviewer will notice every single one.`,
  },
  starKeywords: {
    good:  (_v) => `Full STAR answer. Good.`,
    okay:  (_v) => `One STAR element missing. Add it.`,
    'needs work': (_v) => `No Result in that answer. Bob wants a number.`,
  },
};

export function generateObservations(
  metrics: Metrics,
  mode: Mode,
  postingSkills: string[],
  transcript: string,
): string[] {
  const lines: string[] = [];
  const keys = Object.keys(metrics) as (keyof Metrics)[];

  for (const key of keys) {
    const value = metrics[key];
    const rating: Rating = rateMetric(key, value);
    const templates = (mode === 'tough' && TOUGH_OVERRIDES[key]) ? TOUGH_OVERRIDES[key]! : TEMPLATES[key];
    lines.push(templates[rating](value));
  }

  // Skill check: posting skills not mentioned in transcript
  const lowerTranscript = transcript.toLowerCase();
  for (const skill of postingSkills) {
    if (!lowerTranscript.includes(skill.toLowerCase())) {
      if (mode === 'friendly') {
        lines.push(`The posting asks for ${skill}. Bob didn't hear it mentioned. Could be worth bringing up!`);
      } else {
        lines.push(`The posting asks for ${skill}. Bob didn't hear it.`);
      }
    }
  }

  return lines;
}
