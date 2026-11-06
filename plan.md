# Bobservation: 1 Hour Build Plan

> "Bob's watching. In a good way."

**Constraints:** 60 minutes. No paid APIs, no API keys, no backend, no database. Everything runs in the browser. IBM Bob is the builder, not a runtime service.

**Demo browser:** Google Chrome (needed for the free speech recognition).

---

## 1. What we are building

A single-page web app where a student:
1. Pastes a job posting. The app finds the skills in it.
2. Pastes their resume. The app shows a fit score and the missing skills.
3. Does a webcam mock interview. Bob, the mascot, reads questions picked for that posting.
4. Gets "Bob's Observations": eye contact, head movement, smiling, filler words, speaking pace, and pauses, written in Bob's voice.
5. Sees each session saved in a tracker on the dashboard.

---

## 2. Tech stack (all free)

| Need | Tool |
|---|---|
| App | Vite + React + TypeScript |
| Styling | Tailwind CSS (`@tailwindcss/vite`) |
| Face tracking | MediaPipe Face Landmarker (`@mediapipe/tasks-vision`), in the browser |
| Speech to text | Browser Web Speech API (`webkitSpeechRecognition`) |
| Pause detection | Web Audio API volume meter on the microphone |
| Bob's voice | Browser `speechSynthesis` |
| AI feedback | None. Rule-based templates in Bob's voice |
| Skill matching | Hardcoded skill dictionary + text matching |
| Storage | `localStorage` |
| Deploy | Run on localhost. If time allows, deploy free to Vercel or Netlify |

**Rules (ponytail skill):** simplest thing that works. No router library, no state library, no backend. One page with tabs or views switched by React state. Mark shortcuts with `// ponytail:`.

---

## 3. Files

```
src/
├── App.tsx              # View switching: dashboard, setup, interview, report
├── Bob.tsx              # Mascot (inline SVG) + speech bubble + mood prop
├── Setup.tsx            # Paste posting + resume, show skills and fit score
├── Interview.tsx        # Webcam, face tracking, speech, recording flow
├── Report.tsx           # Bob's Observations
├── Dashboard.tsx        # Saved sessions from localStorage
├── metrics.ts           # Pure functions: landmarks and words → metrics
├── observations.ts      # Rule-based Bob feedback templates
├── skills.ts            # Skill dictionary + question bank
└── storage.ts           # localStorage helpers
public/models/face_landmarker.task
```

---

## 4. Metrics (all computed in the browser)

Run Face Landmarker at about 10 frames per second with `outputFaceBlendshapes: true` and `outputFacialTransformationMatrixes: true`.

| Metric | How | Good | Okay | Needs work |
|---|---|---|---|---|
| Eye contact % | Frame counts when head yaw < 15°, pitch < 12°, and all `eyeLook*` blendshapes < 0.5 | ≥ 70 | 50 to 69 | < 50 |
| Head movement | Average frame-to-frame nose tip (landmark 1) movement | < 0.004 | 0.004 to 0.01 | > 0.01 |
| Smile % | Average of `mouthSmileLeft` and `mouthSmileRight` > 0.4 | ≥ 15 | 5 to 14 | < 5 |
| Fillers per minute | Count "um", "uh", "like", "you know", "basically", "kind of" in the transcript | < 3 | 3 to 6 | > 6 |
| Words per minute | Transcript words / speaking seconds × 60 | 120 to 160 | 100 to 119 or 161 to 180 | other |
| Long pauses | Mic volume below threshold for more than 2 seconds while answering | 0 to 1 | 2 to 3 | > 3 |
| STAR keywords | Look for phrases like "the situation was", "my task", "I built", "as a result", numbers or % | 4 of 4 | 3 of 4 | ≤ 2 |

`// ponytail:` Chrome speech recognition may drop some "um"s, so fillers can be undercounted. Fine for a demo.

**Score:** good = 100, okay = 60, needs work = 25. Overall = average of all metrics.

---

## 5. Bob's voice (observations.ts)

Each metric has a template for good, okay, and needs work, with the real number filled in. Two modes.

**Friendly examples**
- "Bob observed {n} 'um's. Bob believes in you. Try a silent pause instead."
- "Bob noticed {pct}% eye contact. Bob is impressed."
- "Bob is still waiting to hear the Result! Add a number to the ending."

**Tough examples**
- "{n} filler words in {sec} seconds. An interviewer will notice."
- "Eye contact {pct}%. Look at the camera, not the ceiling."
- "No Result in that answer. Bob wants a number."

Skill check: if the posting has a skill that the answer never mentions, add "The posting asks for {skill}. Bob didn't hear it."

---

## 6. Skills and questions (skills.ts)

- Dictionary of about 50 common internship skills (Python, Java, C++, JavaScript, React, SQL, Git, AWS, Docker, Linux, machine learning, data analysis, Excel, communication, teamwork, leadership, and so on). Match case-insensitively against the posting and the resume.
- Fit score = skills found in both / skills found in the posting.
- Question bank: 6 general behavioral questions and 1 or 2 questions per skill. Pick 3 per interview: 2 behavioral + 1 for the top matched skill.

---

## 7. Build steps (60 minutes)

### Step 1 (0 to 5 min): Scaffold
- [ ] `npm create vite@latest bobservation -- --template react-ts`
- [ ] Install `@mediapipe/tasks-vision tailwindcss @tailwindcss/vite`, set up Tailwind
- [ ] Download `face_landmarker.task` into `public/models/`
- [ ] App shell with header "Bobservation" and view switching

**Check:** `npm run dev` shows the header.

### Step 2 (5 to 25 min): Interview screen ⭐
- [ ] Webcam video, mirrored
- [ ] Load Face Landmarker, 10 fps loop, live badges for eye contact and smile
- [ ] Start speech recognition (`continuous = true`, `interimResults = true`), show live transcript
- [ ] Web Audio volume meter for pause detection
- [ ] Bob reads each question with `speechSynthesis`
- [ ] Buttons: Start answer, Stop answer, Next question; 2 minute cap
- [ ] Store metrics and transcript per answer

**Check:** looking away drops eye contact; speaking fills the transcript.

### Step 3 (25 to 35 min): Report card ⭐
- [ ] `metrics.ts` and `observations.ts`
- [ ] Report: overall score, a badge per metric, Bob's observations, transcript with fillers highlighted
- [ ] Friendly or tough toggle before the interview

**Check:** after 3 answers, the report shows real numbers in Bob's voice.

### Step 4 (35 to 45 min): Posting, resume, questions
- [ ] Setup view: paste posting and resume, show skill chips, missing skills, fit score
- [ ] Interview uses questions picked from the posting's skills

**Check:** removing "Python" from the resume makes it show up as missing.

### Step 5 (45 to 52 min): Tracker
- [ ] Save each session (company, role, fit score, overall score, date) to `localStorage`
- [ ] Dashboard lists sessions; click one to open its report

**Check:** refresh the page and sessions are still there.

### Step 6 (52 to 60 min): Bob and polish
- [ ] Simple original Bob SVG with binoculars; moods: neutral, observing, cheering
- [ ] Bob's speech bubble on every screen
- [ ] Clean colors, big readable text for the projector
- [ ] Rehearse the demo once

---

## 8. Cut list (if behind)

1. Tracker (Step 5): show only the latest report
2. Pause detection: skip the volume meter
3. Resume fit score: keep only posting skill extraction
4. Bob moods: one static Bob

**Never cut Step 2 or Step 3.**

---

## 9. Demo (2 minutes)

1. Paste a real internship posting and a resume. Show the fit score and missing skills.
2. Start the interview in tough mode. Answer one question live with a few "um"s.
3. Show Bob's Observations.
4. Line to say: "Everything runs in the browser. The video never leaves my laptop, and there are no paid APIs."