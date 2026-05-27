import { useEffect, useState } from "react";

// ============================================================
// Settings store (persisted)
// ============================================================
export type MusicTrack = "home" | "learn" | "challenge" | null;

export interface AudioSettings {
  musicOn: boolean;
  musicVolume: number; // 0..1
  sfxOn: boolean;
  keypadOn: boolean;
  hapticsOn: boolean;
}

const STORAGE_KEY = "mathstars.audio.v1";

const DEFAULTS: AudioSettings = {
  musicOn: true,
  musicVolume: 0.4,
  sfxOn: true,
  keypadOn: false,
  hapticsOn: true,
};

const load = (): AudioSettings => {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
};

let settings: AudioSettings = load();
const listeners = new Set<() => void>();

const save = () => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
};

export const getAudioSettings = (): AudioSettings => settings;

export const updateAudioSettings = (patch: Partial<AudioSettings>) => {
  settings = { ...settings, ...patch };
  save();
  // Re-apply music to reflect new on/off + volume
  music.refresh();
  listeners.forEach((l) => l());
};

export const useAudioSettings = (): AudioSettings => {
  const [, tick] = useState(0);
  useEffect(() => {
    const l = () => tick((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return settings;
};

// ============================================================
// Web Audio core
// ============================================================
let ctx: AudioContext | null = null;
const getCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
};

// Unlock audio on first user gesture (mobile Safari)
if (typeof window !== "undefined") {
  const unlock = () => {
    getCtx();
    window.removeEventListener("touchend", unlock);
    window.removeEventListener("click", unlock);
  };
  window.addEventListener("touchend", unlock, { passive: true });
  window.addEventListener("click", unlock);
}

const tone = (
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  delay = 0,
  peak = 0.18,
  destination?: AudioNode,
) => {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peak, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(destination ?? c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
};

// ============================================================
// Music engine — procedural ambient loops
// ============================================================
interface TrackCfg {
  notes: number[]; // 0 = rest
  spacing: number; // seconds between steps
  dur: number;
  wave: OscillatorType;
  peak: number;
  bass?: number[]; // optional low pad notes
  bassEvery?: number; // play bass every N steps
}

// C major pentatonic frequencies
const N = {
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
  C3: 130.81, G3: 196.0, F3: 174.61, A3: 220.0,
};

const TRACKS: Record<Exclude<MusicTrack, null>, TrackCfg> = {
  // Home: warm welcoming marimba-ish lullaby
  home: {
    notes: [
      N.C5, 0, N.G4, N.E5,
      N.A4, 0, N.G4, N.C5,
      N.E5, 0, N.G4, N.A4,
      N.C5, 0, N.E5, N.G4,
    ],
    spacing: 0.42,
    dur: 0.7,
    wave: "triangle",
    peak: 0.14,
    bass: [N.C3, N.G3, N.A3, N.F3],
    bassEvery: 4,
  },
  // Learn: calm focused pad
  learn: {
    notes: [
      N.E4, 0, N.G4, 0,
      N.A4, 0, N.G4, 0,
      N.D4, 0, N.E4, 0,
      N.G4, 0, N.A4, 0,
    ],
    spacing: 0.55,
    dur: 0.95,
    wave: "sine",
    peak: 0.11,
    bass: [N.C3, N.F3, N.G3, N.F3],
    bassEvery: 4,
  },
  // Daily Challenge menu: playful anticipation
  challenge: {
    notes: [
      N.G4, N.C5, N.E5, N.G5,
      N.E5, N.C5, N.D5, N.E5,
      N.A4, N.C5, N.E5, N.A5,
      N.G5, N.E5, N.D5, N.C5,
    ],
    spacing: 0.3,
    dur: 0.45,
    wave: "triangle",
    peak: 0.13,
    bass: [N.C3, N.A3, N.F3, N.G3],
    bassEvery: 4,
  },
};

class MusicEngine {
  master: GainNode | null = null;
  filter: BiquadFilterNode | null = null;
  timer: number | null = null;
  current: MusicTrack = null;
  noteIdx = 0;
  startTime = 0;

  private ensureChain() {
    const c = getCtx();
    if (!c) return null;
    if (!this.master) {
      this.filter = c.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.value = 2400;
      this.master = c.createGain();
      this.master.gain.value = 0;
      this.filter.connect(this.master).connect(c.destination);
    }
    return c;
  }

  private targetVolume() {
    return settings.musicOn ? Math.max(0, Math.min(1, settings.musicVolume)) * 0.35 : 0;
  }

  private rampVolume(to: number, time = 0.4) {
    const c = getCtx();
    if (!c || !this.master) return;
    this.master.gain.cancelScheduledValues(c.currentTime);
    this.master.gain.setValueAtTime(this.master.gain.value, c.currentTime);
    this.master.gain.linearRampToValueAtTime(to, c.currentTime + time);
  }

  play(track: MusicTrack) {
    if (track === this.current) {
      this.rampVolume(this.targetVolume(), 0.3);
      return;
    }
    this.stop(0.25);
    if (!track || !settings.musicOn) {
      this.current = track; // remember desired even if muted
      return;
    }
    const c = this.ensureChain();
    if (!c) return;
    this.current = track;
    this.noteIdx = 0;
    this.startTime = c.currentTime + 0.15;
    this.rampVolume(this.targetVolume(), 0.6);
    this.tick();
    this.timer = window.setInterval(() => this.tick(), 250);
  }

  stop(fade = 0.3) {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.rampVolume(0, fade);
  }

  /** React to settings change (on/off, volume) without restarting */
  refresh() {
    if (!this.master) return;
    if (!settings.musicOn) {
      // stop scheduler but keep current memory so it can resume
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      this.rampVolume(0, 0.3);
      return;
    }
    if (this.current && !this.timer) {
      // resume
      const desired = this.current;
      this.current = null;
      this.play(desired);
      return;
    }
    this.rampVolume(this.targetVolume(), 0.3);
  }

  private tick() {
    const c = getCtx();
    if (!c || !this.filter || !this.current) return;
    const cfg = TRACKS[this.current];
    const lookAhead = c.currentTime + 0.4;
    while (this.startTime + this.noteIdx * cfg.spacing < lookAhead) {
      const t = this.startTime + this.noteIdx * cfg.spacing;
      const note = cfg.notes[this.noteIdx % cfg.notes.length];
      if (note > 0) this.scheduleNote(t, note, cfg);
      if (cfg.bass && cfg.bassEvery && this.noteIdx % cfg.bassEvery === 0) {
        const bi = Math.floor(this.noteIdx / cfg.bassEvery) % cfg.bass.length;
        this.scheduleBass(t, cfg.bass[bi]);
      }
      this.noteIdx++;
    }
  }

  private scheduleNote(t: number, freq: number, cfg: TrackCfg) {
    const c = getCtx();
    if (!c || !this.filter) return;
    const osc = c.createOscillator();
    osc.type = cfg.wave;
    osc.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(cfg.peak, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + cfg.dur);
    osc.connect(g).connect(this.filter);
    osc.start(t);
    osc.stop(t + cfg.dur + 0.05);
    // soft harmonic shimmer
    const o2 = c.createOscillator();
    o2.type = "sine";
    o2.frequency.value = freq * 2;
    const g2 = c.createGain();
    g2.gain.setValueAtTime(0, t);
    g2.gain.linearRampToValueAtTime(cfg.peak * 0.22, t + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.001, t + cfg.dur * 0.7);
    o2.connect(g2).connect(this.filter);
    o2.start(t);
    o2.stop(t + cfg.dur + 0.05);
  }

  private scheduleBass(t: number, freq: number) {
    const c = getCtx();
    if (!c || !this.filter) return;
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = c.createGain();
    const dur = 1.6;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.filter);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }
}

const music = new MusicEngine();

export const setMusicTrack = (track: MusicTrack) => {
  music.play(track);
};

export const stopMusic = () => {
  music.stop();
};

// ============================================================
// Sound effects
// ============================================================
const sfxAllowed = () => settings.sfxOn;

export const playCorrect = () => {
  if (!sfxAllowed()) return;
  const notes = [
    { f: 523.25, d: 0.16 },
    { f: 659.25, d: 0.16 },
    { f: 783.99, d: 0.2 },
    { f: 1046.5, d: 0.4 },
  ];
  let t = 0;
  notes.forEach((n, i) => {
    tone(n.f, n.d, "sine", t, 0.14);
    tone(n.f * 2, n.d * 0.9, "sine", t, 0.035);
    t += i === notes.length - 2 ? 0.09 : 0.07;
  });
};

export const playWrong = () => {
  if (!sfxAllowed()) return;
  tone(220, 0.16, "sine", 0, 0.1);
  tone(165, 0.2, "sine", 0.08, 0.1);
};

export const playMenu = () => {
  if (!sfxAllowed()) return;
  tone(660, 0.06, "triangle", 0, 0.08);
  tone(880, 0.08, "triangle", 0.04, 0.07);
};

export const playStar = () => {
  if (!sfxAllowed()) return;
  const seq = [523, 659, 784, 1047, 1319];
  seq.forEach((f, i) => tone(f, 0.18, "triangle", i * 0.06, 0.13));
};

export const playCelebrate = () => {
  if (!sfxAllowed()) return;
  const seq = [392, 523, 659, 784, 988, 1175];
  seq.forEach((f, i) => tone(f, 0.22, "triangle", i * 0.07, 0.14));
};

export const playKeypad = () => {
  if (!settings.keypadOn) return;
  tone(880, 0.04, "square", 0, 0.05);
};

// ============================================================
// Haptics
// ============================================================
type HapticKind = "key" | "tap" | "correct" | "star" | "button";

export const haptic = (kind: HapticKind = "tap") => {
  if (!settings.hapticsOn) return;
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  const map: Record<HapticKind, number | number[]> = {
    key: 6,
    tap: 8,
    button: 12,
    correct: 14,
    star: [10, 30, 14],
  };
  try {
    navigator.vibrate(map[kind]);
  } catch {}
};
