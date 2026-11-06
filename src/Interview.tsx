// Interview.tsx — Webcam, face tracking, speech, recording + Extra 1/2/4

import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { Bob } from './Bob';
import type { BobMood } from './Bob';
import type { FaceFrame } from './metrics';
import { computeMetrics } from './metrics';
import type { AnswerRecord, ReplayEvent } from './storage';
import { X, Mic, MicOff, SkipForward, AlertTriangle, BellOff, Bell, CameraOff } from 'lucide-react';

interface InterviewProps {
  questions: string[];
  postingSkills: string[];
  mode: 'friendly' | 'tough';
  answerTimeLimitSecs?: number;
  practiceMode?: boolean;
  ttsRate?: number;
  onDone: (answers: AnswerRecord[]) => void;
  onCancel: () => void;
}

// ponytail: Chrome's webkitSpeechRecognition
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  start(): void;
  stop(): void;
}
declare global {
  interface Window {
    webkitSpeechRecognition: new () => ISpeechRecognition;
    SpeechRecognition: new () => ISpeechRecognition;
  }
}

const PAUSE_THRESHOLD_DB = -45;
const PAUSE_DURATION_MS = 2000;
const NUDGE_COOLDOWN_MS = 8000;
const FILLERS_RE = /\b(um|uh|like|you know|basically|kind of)\b/gi;

// ── Extra 4: Calibration ──────────────────────────────────────────────────────
interface CalibrationData {
  baseYaw: number;
  basePitch: number;
}

// ── Main component ────────────────────────────────────────────────────────────
export function Interview({
  questions,
  postingSkills,
  mode,
  answerTimeLimitSecs = 120,
  practiceMode = false,
  ttsRate = 0.95,
  onDone,
  onCancel,
}: InterviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const framesRef = useRef<FaceFrame[]>([]);
  const speakingSecondsRef = useRef(0);
  const longPausesRef = useRef(0);
  const lastPauseActiveRef = useRef(false);
  const pauseStartRef = useRef<number>(0);
  const speakingStartRef = useRef<number>(0);
  const answersRef = useRef<AnswerRecord[]>([]);

  // Extra 1: recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const answerStartTimeRef = useRef<number>(0);
  const replayEventsRef = useRef<ReplayEvent[]>([]);

  // Extra 2: nudges
  const lastNudgeTimeRef = useRef<number>(0);
  const eyeContactWindowRef = useRef<boolean[]>([]);
  const fillerWindowRef = useRef<{ time: number }[]>([]);
  const smileWindowRef = useRef<number[]>([]);
  const [nudgesEnabled, setNudgesEnabled] = useState(true);

  // Extra 4: calibration
  const calibrationFramesRef = useRef<FaceFrame[]>([]);
  const calibrationRef = useRef<CalibrationData | null>(null);

  const liveFaceRef = useRef({ eyeContact: 0, smile: 0, total: 0 });

  const [currentQ, setCurrentQ] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'calibrating' | 'ready' | 'answering'>('loading');
  const [calibCountdown, setCalibCountdown] = useState(3);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [timeLeft, setTimeLeft] = useState(answerTimeLimitSecs);
  const [eyeContactPct, setEyeContactPct] = useState(0);
  const [smilePct, setSmilePct] = useState(0);
  const [bobMessage, setBobMessage] = useState(practiceMode ? 'Practice mode — no camera' : 'Loading face tracker…');
  const [bobMood, setBobMood] = useState<BobMood>('neutral');
  const [loadError, setLoadError] = useState('');

  // Ref so keyboard handler can call handleStopAnswer / handleStartAnswer without stale closures
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Camera + landmarker init ──────────────────────────────────────────────
  useEffect(() => {
    // Practice mode: skip all camera/face init, go straight to ready
    if (practiceMode) {
      setPhase('ready');
      setBobMessage(questions[0]);
      speak(questions[0], ttsRate);
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;

    async function init() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        const ctx = new AudioContext();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analyserRef.current = analyser;
      } catch (err: unknown) {
        if (!cancelled) {
          setLoadError(`Camera/mic: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      try {
        const vision = await FilesetResolver.forVisionTasks('/wasm');
        const fl = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: '/models/face_landmarker.task', delegate: 'GPU' },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          runningMode: 'VIDEO',
          numFaces: 1,
        });
        if (!cancelled) {
          landmarkerRef.current = fl;
          startCalibration();
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setLoadError('Face tracker failed to load. Check /models/face_landmarker.task');
          setPhase('ready');
          setBobMessage(questions[0]);
          speak(questions[0], ttsRate);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Ignore if focus is on an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Escape') { onCancel(); return; }
      if (e.code === 'Space') {
        e.preventDefault();
        if (phaseRef.current === 'ready') handleStartAnswer();
        else if (phaseRef.current === 'answering') handleStopAnswer();
        return;
      }
      if (e.code === 'KeyN' && phaseRef.current === 'ready') {
        handleNextQuestion();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Extra 4: Calibration ─────────────────────────────────────────────────
  function startCalibration() {
    setPhase('calibrating');
    setBobMessage('Bob is calibrating. Sit normally and look at the camera.');
    setBobMood('observing');
    calibrationFramesRef.current = [];
    setCalibCountdown(3);

    let count = 3;
    const tick = setInterval(() => {
      count--;
      setCalibCountdown(count);
      if (count <= 0) {
        clearInterval(tick);
        finishCalibration();
      }
    }, 1000);

    let lastT = 0;
    function calibLoop(now: number) {
      if (count <= 0) return;
      animFrameRef.current = requestAnimationFrame(calibLoop);
      if (now - lastT < 100) return;
      lastT = now;
      const video = videoRef.current;
      const fl = landmarkerRef.current;
      if (!video || !fl || video.readyState < 2) return;
      const result = fl.detectForVideo(video, now);
      if (!result.faceLandmarks?.length) return;
      const matrix = result.facialTransformationMatrixes?.[0]?.data;
      if (matrix && matrix.length >= 16) {
        const pitch = Math.asin(-matrix[9]) * (180 / Math.PI);
        const yaw = Math.atan2(matrix[8], matrix[10]) * (180 / Math.PI);
        calibrationFramesRef.current.push({
          yaw, pitch, eyeLookMax: 0, smileLeft: 0, smileRight: 0, noseTipX: 0, noseTipY: 0
        });
      }
    }
    animFrameRef.current = requestAnimationFrame(calibLoop);
  }

  function finishCalibration() {
    cancelAnimationFrame(animFrameRef.current);
    const frames = calibrationFramesRef.current;
    if (frames.length > 0) {
      const avgYaw = frames.reduce((s, f) => s + f.yaw, 0) / frames.length;
      const avgPitch = frames.reduce((s, f) => s + f.pitch, 0) / frames.length;
      calibrationRef.current = { baseYaw: avgYaw, basePitch: avgPitch };
    }
    setPhase('ready');
    setBobMood('neutral');
    setBobMessage(questions[0]);
    speak(questions[0], ttsRate);
  }

  // ── Face detection loop ───────────────────────────────────────────────────
  const startFaceLoop = useCallback(() => {
    let lastTime = 0;
    function loop(now: number) {
      animFrameRef.current = requestAnimationFrame(loop);
      if (now - lastTime < 100) return;
      lastTime = now;
      const video = videoRef.current;
      const fl = landmarkerRef.current;
      if (!video || !fl || video.readyState < 2) return;
      const result = fl.detectForVideo(video, now);
      if (!result.faceLandmarks?.length) return;
      const landmarks = result.faceLandmarks[0];
      const blendshapes = result.faceBlendshapes?.[0]?.categories ?? [];
      const matrix = result.facialTransformationMatrixes?.[0]?.data;
      let yaw = 0, pitch = 0;
      if (matrix && matrix.length >= 16) {
        pitch = Math.asin(-matrix[9]) * (180 / Math.PI);
        yaw = Math.atan2(matrix[8], matrix[10]) * (180 / Math.PI);
      }
      const calib = calibrationRef.current;
      if (calib) { yaw -= calib.baseYaw; pitch -= calib.basePitch; }

      const eyeLookNames = ['eyeLookDownLeft','eyeLookDownRight','eyeLookOutLeft','eyeLookOutRight','eyeLookUpLeft','eyeLookUpRight','eyeLookInLeft','eyeLookInRight'];
      const eyeLookMax = Math.max(...eyeLookNames.map(n => blendshapes.find(b => b.categoryName === n)?.score ?? 0));
      const smileLeft = blendshapes.find(b => b.categoryName === 'mouthSmileLeft')?.score ?? 0;
      const smileRight = blendshapes.find(b => b.categoryName === 'mouthSmileRight')?.score ?? 0;
      const noseTip = landmarks[1];
      const frame: FaceFrame = { yaw, pitch, eyeLookMax, smileLeft, smileRight, noseTipX: noseTip?.x ?? 0, noseTipY: noseTip?.y ?? 0 };
      framesRef.current.push(frame);

      const live = liveFaceRef.current;
      live.total++;
      const isLooking = Math.abs(yaw) < 15 && Math.abs(pitch) < 12 && eyeLookMax < 0.5;
      if (isLooking) live.eyeContact++;
      const smileAvg = (smileLeft + smileRight) / 2;
      if (smileAvg > 0.4) live.smile++;
      setEyeContactPct(Math.round((live.eyeContact / live.total) * 100));
      setSmilePct(Math.round((live.smile / live.total) * 100));

      // ── Extra 2: nudge windows ──────────────────────────────────────────
      if (nudgesEnabled) {
        const nowMs = Date.now();
        eyeContactWindowRef.current.push(isLooking);
        if (eyeContactWindowRef.current.length > 30) eyeContactWindowRef.current.shift();
        smileWindowRef.current.push(smileAvg);
        if (smileWindowRef.current.length > 300) smileWindowRef.current.shift();
        checkNudges(nowMs);
      }

      // ── Extra 1: log looked-away events ────────────────────────────────
      if (!isLooking && answerStartTimeRef.current > 0) {
        const offset = Date.now() - answerStartTimeRef.current;
        const last = replayEventsRef.current[replayEventsRef.current.length - 1];
        if (!last || last.type !== 'looked-away' || offset - last.offsetMs > 3000) {
          replayEventsRef.current.push({ offsetMs: offset, type: 'looked-away', label: 'Looked away' });
        }
      }
    }
    animFrameRef.current = requestAnimationFrame(loop);
  }, [nudgesEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopFaceLoop = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  // ── Extra 2: nudge logic ──────────────────────────────────────────────────
  function checkNudges(nowMs: number) {
    if (nowMs - lastNudgeTimeRef.current < NUDGE_COOLDOWN_MS) return;

    const eyeWindow = eyeContactWindowRef.current;
    if (eyeWindow.length >= 30) {
      const contactPct = eyeWindow.filter(Boolean).length / eyeWindow.length;
      if (contactPct < 0.5) {
        triggerNudge("Psst — Bob's over here! Look at the camera.", 'concerned', nowMs);
        return;
      }
    }

    const tenSecondsAgo = nowMs - 10000;
    const recentFillers = fillerWindowRef.current.filter(f => f.time > tenSecondsAgo);
    if (recentFillers.length >= 3) {
      triggerNudge('Slow down, take a breath.', 'concerned', nowMs);
      return;
    }

    const smileWindow = smileWindowRef.current;
    if (smileWindow.length >= 300) {
      const avgSmile = smileWindow.reduce((a, b) => a + b, 0) / smileWindow.length;
      if (avgSmile < 0.05) {
        triggerNudge('A small smile goes a long way!', 'observing', nowMs);
        return;
      }
    }
  }

  function triggerNudge(msg: string, mood: BobMood, nowMs: number) {
    lastNudgeTimeRef.current = nowMs;
    setBobMessage(msg);
    setBobMood(mood);
    if (answerStartTimeRef.current > 0) {
      replayEventsRef.current.push({ offsetMs: nowMs - answerStartTimeRef.current, type: 'nudge', label: msg });
    }
    setTimeout(() => {
      setBobMessage('Bob is observing…');
      setBobMood('observing');
    }, 3500);
  }

  // ── Speech recognition ───────────────────────────────────────────────────
  const startSpeech = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;
    const recog = new SR();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = 'en-US';
    let finalText = '';
    recog.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalText += text + ' ';
          let m: RegExpExecArray | null;
          const re = new RegExp(FILLERS_RE.source, 'gi');
          while ((m = re.exec(text)) !== null) {
            fillerWindowRef.current.push({ time: Date.now() });
            if (answerStartTimeRef.current > 0) {
              replayEventsRef.current.push({
                offsetMs: Date.now() - answerStartTimeRef.current,
                type: 'filler',
                label: `"${m[0]}"`,
              });
            }
          }
        } else interim = text;
      }
      setTranscript(finalText);
      setInterimTranscript(interim);
    };
    recog.onerror = () => {};
    recog.start();
    recognitionRef.current = recog;
  }, []);

  const stopSpeech = useCallback((): string => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    let t = '';
    setTranscript(prev => { t = prev; return prev; });
    return t;
  }, []);

  // ── Pause detection ───────────────────────────────────────────────────────
  const startPauseDetection = useCallback(() => {
    const analyserNode = analyserRef.current;
    if (!analyserNode) return;
    const data = new Float32Array(analyserNode.fftSize);
    let inPause = false;
    let pauseStart = 0;
    function checkVolume() {
      analyserNode!.getFloatTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      const rms = Math.sqrt(sum / data.length);
      const db = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
      const isSilent = db < PAUSE_THRESHOLD_DB;
      if (isSilent && !inPause) {
        inPause = true;
        pauseStart = Date.now();
        pauseStartRef.current = pauseStart;
      } else if (!isSilent && inPause) {
        inPause = false;
        const dur = Date.now() - pauseStart;
        if (dur > PAUSE_DURATION_MS) {
          longPausesRef.current++;
          if (answerStartTimeRef.current > 0) {
            replayEventsRef.current.push({
              offsetMs: Date.now() - answerStartTimeRef.current,
              type: 'long-pause',
              label: `Pause (${(dur / 1000).toFixed(1)}s)`,
            });
          }
        }
        speakingSecondsRef.current += (Date.now() - speakingStartRef.current - dur) / 1000;
        speakingStartRef.current = Date.now();
      }
      pauseTimerRef.current = setTimeout(checkVolume, 200);
    }
    speakingStartRef.current = Date.now();
    lastPauseActiveRef.current = false;
    checkVolume();
  }, []);

  const stopPauseDetection = useCallback(() => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
  }, []);

  // ── Extra 1: MediaRecorder ────────────────────────────────────────────────
  function startRecording() {
    if (practiceMode) return;
    const video = videoRef.current;
    if (!video?.srcObject) return;
    try {
      const stream = video.srcObject as MediaStream;
      const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
      recordedChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mr.start(500);
      mediaRecorderRef.current = mr;
    } catch {
      // MediaRecorder unsupported — skip silently
    }
  }

  function stopRecording(): string | undefined {
    return new Promise<string | undefined>(resolve => {
      const mr = mediaRecorderRef.current;
      if (!mr || mr.state === 'inactive') { resolve(undefined); return; }
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        resolve(URL.createObjectURL(blob));
      };
      mr.stop();
      mediaRecorderRef.current = null;
    }) as unknown as string | undefined;
  }

  // ── Answer timer ──────────────────────────────────────────────────────────
  const startAnswerTimer = useCallback(() => {
    setTimeLeft(answerTimeLimitSecs);
    answerTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleStopAnswer(); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, [answerTimeLimitSecs]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopAnswerTimer = useCallback(() => {
    if (answerTimerRef.current) clearInterval(answerTimerRef.current);
  }, []);

  // ── Start / stop answer ───────────────────────────────────────────────────
  function handleStartAnswer() {
    framesRef.current = [];
    speakingSecondsRef.current = 0;
    longPausesRef.current = 0;
    liveFaceRef.current = { eyeContact: 0, smile: 0, total: 0 };
    replayEventsRef.current = [];
    eyeContactWindowRef.current = [];
    smileWindowRef.current = [];
    fillerWindowRef.current = [];
    answerStartTimeRef.current = Date.now();
    setTranscript('');
    setInterimTranscript('');
    setPhase('answering');
    setBobMood('observing');
    setBobMessage('Bob is observing…');
    if (!practiceMode) startFaceLoop();
    startSpeech();
    startPauseDetection();
    startAnswerTimer();
    startRecording();
  }

  async function handleStopAnswer() {
    if (!practiceMode) stopFaceLoop();
    stopSpeech();
    stopPauseDetection();
    stopAnswerTimer();

    const videoBlobUrl = await (stopRecording() as unknown as Promise<string | undefined>);

    let finalTranscript = '';
    setTranscript(prev => { finalTranscript = prev; return prev; });

    setTimeout(() => {
      let tx = '';
      setTranscript(prev => { tx = prev; return prev; });
      const metrics = computeMetrics({
        frames: framesRef.current,
        transcript: tx || finalTranscript,
        speakingSeconds: Math.max(speakingSecondsRef.current, 1),
        longPauseCount: longPausesRef.current,
      });
      const record: AnswerRecord = {
        question: questions[currentQ],
        transcript: tx || finalTranscript,
        metrics: metrics as unknown as Record<string, number>,
        events: [...replayEventsRef.current],
        videoBlobUrl,
        // store posting skills + mode for per-answer AI grading context
        postingSkills,
        mode,
      };
      answersRef.current = [...answersRef.current, record];
      if (currentQ + 1 >= questions.length) {
        onDone(answersRef.current);
      } else {
        const nextQ = currentQ + 1;
        setCurrentQ(nextQ);
        setPhase('ready');
        setBobMood('neutral');
        setBobMessage(questions[nextQ]);
        speak(questions[nextQ], ttsRate);
      }
    }, 200);
  }

  function handleNextQuestion() {
    if (currentQ + 1 >= questions.length) return;
    const next = currentQ + 1;
    setCurrentQ(next);
    setPhase('ready');
    setBobMood('neutral');
    setBobMessage(questions[next]);
    speak(questions[next], ttsRate);
  }

  function speak(text: string, rate = 0.95) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = rate;
    window.speechSynthesis.speak(utt);
  }

  function highlightFillers(text: string): React.ReactNode {
    const re = /\b(um|uh|like|you know|basically|kind of)\b/gi;
    const parts: React.ReactNode[] = [];
    let last = 0, match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      parts.push(text.slice(last, match.index));
      parts.push(<mark key={match.index} className="filler-mark">{match[0]}</mark>);
      last = match.index + match[0].length;
    }
    parts.push(text.slice(last));
    return <>{parts}</>;
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* ── Progress ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: '#5A7060', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {phase === 'calibrating' ? 'Calibrating…' : `Question ${currentQ + 1} / ${questions.length}`}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Keyboard hint */}
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: '#5A7060', opacity: 0.7, letterSpacing: '0.04em' }}>
            Space · N · Esc
          </span>
          {/* Extra 2: nudge toggle (only when camera) */}
          {!practiceMode && (
            <button
              onClick={() => setNudgesEnabled(n => !n)}
              title={nudgesEnabled ? 'Disable live nudges' : 'Enable live nudges'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: nudgesEnabled ? '#F26B1D' : '#5A7060', display: 'flex', alignItems: 'center' }}
            >
              {nudgesEnabled ? <Bell size={16} /> : <BellOff size={16} />}
            </button>
          )}
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A7060', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'Instrument Sans', sans-serif", fontSize: '0.875rem' }}
          >
            <X size={15} /> Cancel
          </button>
        </div>
      </div>

      {/* Progress track */}
      <div style={{ height: '4px', background: '#D9CFBF', borderRadius: '2px', marginBottom: '2rem' }}>
        <div style={{ height: '100%', width: `${(currentQ / questions.length) * 100}%`, background: '#F26B1D', borderRadius: '2px', transition: 'width 0.3s' }} />
      </div>

      {loadError && (
        <div className="nb-card" style={{ padding: '0.875rem 1rem', display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '1.5rem', borderColor: '#b8860b' }}>
          <AlertTriangle size={16} style={{ color: '#b8860b', flexShrink: 0, marginTop: '2px' }} />
          <span style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '0.875rem', color: '#5A7060' }}>{loadError}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: practiceMode ? '1fr' : '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Webcam (hidden in practice mode) ── */}
        {!practiceMode && (
          <div style={{ position: 'relative' }}>
            <video
              ref={videoRef}
              style={{ width: '100%', borderRadius: '3px', background: '#1F3D2B', border: '1.5px solid #D9CFBF', display: 'block', transform: 'scaleX(-1)' }}
              muted playsInline
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* HUD overlays */}
            {phase === 'answering' && (
              <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span className="hud-label">Eye Contact {eyeContactPct}%</span>
                <span className="hud-label">Smile {smilePct}%</span>
                <span className={`hud-label ${timeLeft <= 30 ? 'hud-label-danger' : ''}`}>
                  {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                </span>
              </div>
            )}

            {/* Extra 4: calibration overlay */}
            {phase === 'calibrating' && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '12px',
                background: 'rgba(31,61,43,0.55)', borderRadius: '3px',
              }}>
                <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 900, fontSize: '4rem', color: '#FFE066', lineHeight: 1 }}>
                  {calibCountdown}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: '#F6F1E7', letterSpacing: '0.06em', textAlign: 'center' }}>
                  SIT NORMALLY · LOOK AT CAMERA
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Bob + controls ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Practice mode badge */}
          {practiceMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 0.75rem', background: '#f5f0fd', border: '1.5px solid #6d40c4', borderRadius: '3px' }}>
              <CameraOff size={14} style={{ color: '#6d40c4' }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#6d40c4', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Practice Mode — no video recorded
              </span>
            </div>
          )}

          <Bob mood={bobMood} message={bobMessage} size={100} />

          {/* Calibrating */}
          {phase === 'calibrating' && (
            <div className="nb-card" style={{ padding: '1rem', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Caveat', cursive", fontSize: '1.1rem', color: '#1F3D2B', margin: 0 }}>
                Bob is setting a baseline for your position and head angle.
              </p>
            </div>
          )}

          {/* Loading */}
          {phase === 'loading' && (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem', color: '#5A7060', textAlign: 'center' }}>
              Initialising face tracker…
            </p>
          )}

          {/* Ready */}
          {phase === 'ready' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="nb-card ruled" style={{ padding: '1.25rem', paddingTop: '1.5rem' }}>
                <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: '1.0625rem', color: '#1F3D2B', margin: 0, lineHeight: 1.4 }}>
                  {questions[currentQ]}
                </p>
              </div>
              <button onClick={handleStartAnswer} className="btn btn-accent btn-full btn-lg">
                <Mic size={18} />
                Start Answer
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', opacity: 0.7, marginLeft: 'auto' }}>[Space]</span>
              </button>
              {currentQ < questions.length - 1 && (
                <button onClick={handleNextQuestion} className="btn btn-ghost btn-full">
                  <SkipForward size={15} />
                  Skip this question
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', opacity: 0.7, marginLeft: 'auto' }}>[N]</span>
                </button>
              )}
            </div>
          )}

          {/* Answering */}
          {phase === 'answering' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Timer shown in practice mode (no HUD) */}
              {practiceMode && (
                <div style={{ textAlign: 'center' }}>
                  <span className={`hud-label ${timeLeft <= 30 ? 'hud-label-danger' : ''}`} style={{ fontSize: '1.25rem', padding: '0.3rem 1rem' }}>
                    {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                  </span>
                </div>
              )}
              <button onClick={handleStopAnswer} className="btn btn-danger btn-full btn-lg">
                <MicOff size={18} />
                Stop Answer
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', opacity: 0.7, marginLeft: 'auto' }}>[Space]</span>
              </button>
              <div className="nb-card" style={{ padding: '0.875rem', minHeight: '80px', fontFamily: "'Instrument Sans', sans-serif", fontSize: '0.9rem', color: '#1F3D2B', lineHeight: 1.6 }}>
                {highlightFillers(transcript)}
                <span style={{ color: '#5A7060', fontStyle: 'italic' }}>{interimTranscript}</span>
                {!transcript && !interimTranscript && (
                  <span style={{ color: '#5A7060', fontStyle: 'italic', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8125rem' }}>Listening…</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
