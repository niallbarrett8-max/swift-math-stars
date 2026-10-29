import { useEffect, useState } from "react";

// ============================================================
// Settings store (persisted)
// ============================================================
export type MusicTrack = "carefree" | null;

export interface AudioSettings {
  musicOn: boolean;
  musicVolume: number;   // 0..1
  sfxOn: boolean;
  sfxVolume: number;     // 0..1
  keypadOn: boolean;
  keypadVolume: number;  // 0..1
  hapticsOn: boolean;
}

const STORAGE_KEY = "mathstars.audio.v2";

const DEFAULTS: AudioSettings = {
  musicOn: true,
  musicVolume: 0.05,
  sfxOn: true,
  sfxVolume: 0.7,
  keypadOn: false,
  keypadVolume: 0.7,
  hapticsOn: true,
};

const load = (): AudioSettings => {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
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
  backgroundMusic.refresh();
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

// Shared noise buffer (for tactile clicks)
let noiseBuf: AudioBuffer | null = null;
const getNoise = (): AudioBuffer | null => {
  const c = getCtx();
  if (!c) return null;
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 0.3, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
};

// ============================================================
// Shared looping background music
// ============================================================
class BackgroundMusic {
  private player: HTMLAudioElement | null = null;
  private currentTrack: MusicTrack = null;
  private pausedForGameplay = false;
  private hidden = false;

  private getPlayer() {
    if (typeof window === "undefined") return null;
    if (!this.player) {
      this.player = new Audio();
      this.player.src = `${import.meta.env.BASE_URL}carefree.mp3`;
      this.player.loop = true;
      this.player.preload = "auto";
      this.player.volume = this.musicVolume();
      this.player.addEventListener("error", () => {
        console.error("Failed to load Math Stars background music.", this.player?.error);
      });
    }
    return this.player;
  }

  private musicVolume() {
    return Math.max(0, Math.min(1, settings.musicVolume));
  }

  private sync() {
    if (this.player) this.player.volume = this.musicVolume();

    if (
      !settings.musicOn ||
      !this.currentTrack ||
      this.pausedForGameplay ||
      this.hidden
    ) {
      this.player?.pause();
      return;
    }

    const player = this.getPlayer();
    if (!player || !player.paused) return;

    player.play().catch((error: unknown) => {
      if (
        error instanceof DOMException &&
        (error.name === "NotAllowedError" || error.name === "AbortError")
      ) {
        // Browsers can reject playback until a user gesture; retry on the next one.
        return;
      }
      console.error("Failed to play Math Stars background music.", error);
    });
  }

  setTrack(track: MusicTrack) {
    if (track === null) {
      this.pausedForGameplay = true;
      this.player?.pause();
      return;
    }

    this.currentTrack = track;
    this.pausedForGameplay = false;
    this.sync();
  }

  refresh() {
    this.sync();
  }

  stop() {
    this.currentTrack = null;
    this.pausedForGameplay = true;
    this.player?.pause();
  }

  handleVisibilityChange(hidden: boolean) {
    this.hidden = hidden;
    this.sync();
  }
}

const backgroundMusic = new BackgroundMusic();

export const setMusicTrack = (track: MusicTrack) => {
  backgroundMusic.setTrack(track);
};

export const stopMusic = () => {
  backgroundMusic.stop();
};

// Keep Web Audio effects unlocked and retry file playback on user gestures.
if (typeof window !== "undefined") {
  const unlock = () => {
    getCtx();
    backgroundMusic.refresh();
  };
  window.addEventListener("touchend", unlock, { passive: true });
  window.addEventListener("pointerdown", unlock);

  const onHide = () => backgroundMusic.handleVisibilityChange(true);
  const onShow = () => backgroundMusic.handleVisibilityChange(false);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) onHide();
    else onShow();
  });
  window.addEventListener("pagehide", onHide);
  window.addEventListener("blur", onHide);
  window.addEventListener("pageshow", onShow);
  window.addEventListener("focus", onShow);
}

// ============================================================
// Modern, subtle sound effects
// ============================================================
const sfxAllowed = () => settings.sfxOn;

/** Soft warm chime — quick, modern, satisfying */
export const playCorrect = () => {
  if (!sfxAllowed()) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;

  const out = c.createGain();
  out.gain.value = 0.9 * Math.max(0, Math.min(1, settings.sfxVolume));
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 3200;
  filter.Q.value = 0.6;
  out.connect(filter).connect(c.destination);

  // Two soft sine bells, slight detune for warmth
  const partials: Array<[number, number, number]> = [
    [660, 0.0, 0.16], // E5
    [988, 0.06, 0.13], // B5
  ];
  partials.forEach(([f, delay, peak]) => {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    const g = c.createGain();
    const start = now + delay;
    const dur = 0.5;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(peak, start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0008, start + dur);
    osc.connect(g).connect(out);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  });
};

/** Soft, gentle, non-punishing low thud */
export const playWrong = () => {
  if (!sfxAllowed()) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);
  const g = c.createGain();
  const wrongPeak = 0.09 * Math.max(0, Math.min(1, settings.sfxVolume));
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(wrongPeak, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0005, now + 0.3);
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 600;
  osc.connect(g).connect(filter).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.35);
};

/** Subtle UI tap */
export const playMenu = () => {
  if (!sfxAllowed()) return;
  const v = Math.max(0, Math.min(1, settings.sfxVolume));
  playTactile(0.045, 800, 0.07 * v);
};

/** Star reward — gentle warm shimmer */
export const playStar = () => {
  if (!sfxAllowed()) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 4000;
  filter.connect(c.destination);
  const seq: Array<[number, number]> = [
    [523.25, 0],
    [659.25, 0.08],
    [783.99, 0.16],
    [1046.5, 0.26],
  ];
  const starPeak = 0.09 * Math.max(0, Math.min(1, settings.sfxVolume));
  seq.forEach(([f, d]) => {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    const g = c.createGain();
    const start = now + d;
    const dur = 0.55;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(starPeak, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, start + dur);
    osc.connect(g).connect(filter);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  });
};

export const playCelebrate = () => {
  if (!sfxAllowed()) return;
  playStar();
};

/** Physical tactile click — filtered noise burst (NOT a musical tone) */
const playTactile = (duration = 0.04, cutoff = 650, peak = 0.08) => {
  const c = getCtx();
  const buf = getNoise();
  if (!c || !buf) return;
  const now = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = buf;
  // randomize offset for variation
  const offset = Math.random() * (buf.duration - duration - 0.01);
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  filter.Q.value = 0.9;
  const g = c.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(peak, now + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0005, now + duration);
  // tiny low sine "body" for a softer thump
  const body = c.createOscillator();
  body.type = "sine";
  body.frequency.value = 120;
  const bg = c.createGain();
  bg.gain.setValueAtTime(0, now);
  bg.gain.linearRampToValueAtTime(peak * 0.6, now + 0.004);
  bg.gain.exponentialRampToValueAtTime(0.0005, now + duration * 1.1);
  body.connect(bg).connect(c.destination);
  src.connect(filter).connect(g).connect(c.destination);
  src.start(now, offset);
  src.stop(now + duration + 0.02);
  body.start(now);
  body.stop(now + duration * 1.2 + 0.02);
};

/**
 * Premium UI click — used for ALL buttons, keys, and text-input presses.
 * Narrow high-frequency bandpass (1100–5500 Hz) filtered noise burst:
 * very short (15 ms), light, crisp, no low-end body. Feels like a modern
 * smartphone interaction rather than a game sound effect.
 */
export const playClick = () => {
  if (!settings.keypadOn) return;
  const c = getCtx();
  const buf = getNoise();
  if (!c || !buf) return;
  const now = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = buf;
  const offset = Math.random() * Math.max(0, buf.duration - 0.02);

  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1100;
  hp.Q.value = 0.4;

  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 5500;
  lp.Q.value = 0.5;

  const clickPeak = 0.030 * Math.max(0, Math.min(1, settings.keypadVolume));
  const g = c.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(clickPeak, now + 0.0005);
  g.gain.exponentialRampToValueAtTime(0.0005, now + 0.015);

  src.connect(hp).connect(lp).connect(g).connect(c.destination);
  src.start(now, offset);
  src.stop(now + 0.018);
};

/** Alias kept for backward compatibility. */
export const playKeypad = playClick;

// ============================================================
// Achievement sounds — tiered reward audio (Bronze → Daily)
// ============================================================

export type AchievementTier = "bronze" | "silver" | "gold" | "daily";

/**
 * Achievement flourish — a musical "ta-da" moment rather than a note sequence.
 *
 * Structure: rapid ornamental grace notes rushing upward, landing on a
 * sustained resonant note. Silver/Gold/Daily add a lower harmony voice on
 * the landing for richness. All tones are sine waves; filter opens
 * progressively for each tier (brighter = more celebratory).
 *
 * bronze : 2 grace → G5 landing               ~0.70 s
 * silver : 3 grace → C6 landing + E6 harmony  ~0.82 s
 * gold   : 4 grace → E6 landing + C6 harmony  ~0.98 s
 * daily  : 5 grace → G6 landing + E6 harmony  ~1.10 s
 */
export const playAchievement = (tier: AchievementTier) => {
  if (!sfxAllowed()) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const vol = Math.max(0, Math.min(1, settings.sfxVolume));

  // Grace note params: very short (42 ms total, 9 ms attack),
  // quieter than landing so they feel like ornaments not separate notes.
  const GD = 0.042;  // grace duration
  const GA = 0.009;  // grace attack
  const GI = 0.052;  // interval between grace note starts (slight overlap)
  const LA = 0.020;  // landing attack

  // [freq Hz, startOffset s, peakGain, totalDur s]
  type N = [number, number, number, number];

  type Cfg = { grace: N[]; land: N; harmony?: N };

  const cfgs: Record<AchievementTier, Cfg> = {
    bronze: {
      grace: [
        [523.25, 0 * GI, 0.060 * vol, GD],  // C5
        [659.25, 1 * GI, 0.068 * vol, GD],  // E5
      ],
      land:    [783.99, 2 * GI, 0.115 * vol, 0.60],  // G5
    },
    silver: {
      grace: [
        [523.25, 0 * GI, 0.055 * vol, GD],  // C5
        [659.25, 1 * GI, 0.062 * vol, GD],  // E5
        [783.99, 2 * GI, 0.068 * vol, GD],  // G5
      ],
      land:    [1046.5, 3 * GI, 0.115 * vol, 0.66],  // C6
      harmony: [1318.5, 3 * GI + 0.045, 0.055 * vol, 0.56],  // E6 (enters late, softer)
    },
    gold: {
      grace: [
        [523.25, 0 * GI, 0.055 * vol, GD],  // C5
        [659.25, 1 * GI, 0.060 * vol, GD],  // E5
        [783.99, 2 * GI, 0.065 * vol, GD],  // G5
        [1046.5, 3 * GI, 0.072 * vol, GD],  // C6
      ],
      land:    [1318.5, 4 * GI, 0.115 * vol, 0.76],  // E6
      harmony: [1046.5, 4 * GI + 0.025, 0.060 * vol, 0.68],  // C6 below (richer chord)
    },
    daily: {
      grace: [
        [523.25, 0 * GI, 0.055 * vol, GD],  // C5
        [659.25, 1 * GI, 0.060 * vol, GD],  // E5
        [783.99, 2 * GI, 0.065 * vol, GD],  // G5
        [1046.5, 3 * GI, 0.070 * vol, GD],  // C6
        [1318.5, 4 * GI, 0.076 * vol, GD],  // E6
      ],
      land:    [1568.0, 5 * GI, 0.115 * vol, 0.86],  // G6 (highest, most triumphant)
      harmony: [1318.5, 5 * GI + 0.030, 0.065 * vol, 0.76],  // E6 below
    },
  };

  const cutoffs: Record<AchievementTier, number> = {
    bronze: 5000,
    silver: 6500,
    gold:   8000,
    daily:  10000,
  };

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoffs[tier];
  filter.Q.value = 0.3;
  filter.connect(c.destination);

  const playNote = ([freq, offset, peak, dur]: N, isGrace: boolean) => {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = c.createGain();
    const t = now + offset;
    const attack = isGrace ? GA : LA;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(filter);
    osc.start(t);
    osc.stop(t + dur + 0.08);
  };

  const cfg = cfgs[tier];
  cfg.grace.forEach((n) => playNote(n, true));
  playNote(cfg.land, false);
  if (cfg.harmony) playNote(cfg.harmony, false);
};

// ============================================================
// Haptics
// ============================================================

/**
 * Supported haptic kinds:
 *   key / tap / button  — UI interaction (light)
 *   correct             — positive feedback
 *   wrong               — error double-pulse
 *   star (legacy)       — same as bronze
 *   bronze/silver/gold  — tiered achievement pulses (Android)
 *   daily               — most rewarding triple-pulse
 *
 * NOTE: navigator.vibrate() is Android-only.
 * iOS Safari and iOS Chrome do not implement this API at all —
 * there is no vibration in browser, PWA, or Replit preview on iPhone.
 * True iOS haptics require a Capacitor native build.
 */
type HapticKind =
  | "key" | "tap" | "button"
  | "correct" | "wrong"
  | "star"
  | "bronze" | "silver" | "gold" | "daily";

export const haptic = (kind: HapticKind = "tap") => {
  if (!settings.hapticsOn) return;
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (typeof nav.vibrate !== "function") return;
  const map: Record<HapticKind, number | number[]> = {
    key:    6,
    tap:    8,
    button: 10,
    correct: 20,
    wrong:  [20, 8, 20],
    star:   [12, 45, 18],
    bronze: [12, 45, 18],
    silver: [15, 45, 22, 50, 15],
    gold:   [18, 45, 26, 50, 18],
    daily:  [20, 40, 30, 50, 30, 55, 20],
  };
  try {
    nav.vibrate(map[kind]);
  } catch {}
};
