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

const STORAGE_KEY = "mathstars.audio.v2";

const DEFAULTS: AudioSettings = {
  musicOn: true,
  musicVolume: 0.45,
  sfxOn: true,
  keypadOn: false,
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
  ambient.refresh();
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

// Unlock on first gesture (mobile Safari)
if (typeof window !== "undefined") {
  const unlock = () => {
    getCtx();
    window.removeEventListener("touchend", unlock);
    window.removeEventListener("pointerdown", unlock);
  };
  window.addEventListener("touchend", unlock, { passive: true });
  window.addEventListener("pointerdown", unlock);
}

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
// Ambient atmosphere engine — non-melodic, layered pads
// ============================================================
interface AmbientCfg {
  /** Sustained drone pad notes (frequencies). Layered. */
  pad: number[];
  /** Filter cutoff for the pad bus */
  cutoff: number;
  /** Range of seconds between sparse atmospheric notes */
  sparkleEvery: [number, number];
  /** Frequency pool for sparse atmospheric notes */
  sparklePool: number[];
  /** Per-sparkle peak gain */
  sparklePeak: number;
  /** Sparkle attack (s) */
  sparkleAttack: number;
  /** Sparkle release (s) */
  sparkleRelease: number;
  wave: OscillatorType;
}

// Warm low frequencies; we deliberately avoid bright melodic ranges
const ATMOS: Record<Exclude<MusicTrack, null>, AmbientCfg> = {
  // Home: warm, welcoming, cozy
  home: {
    pad: [110, 164.81, 220], // A2, E3, A3
    cutoff: 900,
    sparkleEvery: [4.5, 9],
    sparklePool: [261.63, 329.63, 392.0, 440.0, 523.25], // C4..C5 pentatonic
    sparklePeak: 0.05,
    sparkleAttack: 0.8,
    sparkleRelease: 3.5,
    wave: "triangle",
  },
  // Learn/Practice: calm, focused, study
  learn: {
    pad: [98, 146.83, 196], // G2, D3, G3
    cutoff: 700,
    sparkleEvery: [7, 14],
    sparklePool: [196.0, 261.63, 293.66, 392.0],
    sparklePeak: 0.035,
    sparkleAttack: 1.5,
    sparkleRelease: 5,
    wave: "sine",
  },
  // Daily challenge menu: lightly motivational anticipation
  challenge: {
    pad: [130.81, 196, 261.63], // C3, G3, C4
    cutoff: 1100,
    sparkleEvery: [3, 6],
    sparklePool: [392.0, 440.0, 523.25, 587.33, 659.25, 783.99],
    sparklePeak: 0.06,
    sparkleAttack: 0.4,
    sparkleRelease: 2.4,
    wave: "triangle",
  },
};

class AmbientEngine {
  master: GainNode | null = null;
  filter: BiquadFilterNode | null = null;
  padOscs: { osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode; lfoGain: GainNode }[] = [];
  sparkleTimer: number | null = null;
  current: MusicTrack = null;
  pausedByVisibility = false;

  private ensureChain() {
    const c = getCtx();
    if (!c) return null;
    if (!this.master) {
      this.filter = c.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.value = 900;
      this.filter.Q.value = 0.4;
      this.master = c.createGain();
      this.master.gain.value = 0;
      this.filter.connect(this.master).connect(c.destination);
    }
    return c;
  }

  private targetVolume() {
    if (!settings.musicOn) return 0;
    return Math.max(0, Math.min(1, settings.musicVolume)) * 0.28;
  }

  private rampVolume(to: number, time = 0.6) {
    const c = getCtx();
    if (!c || !this.master) return;
    const now = c.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(to, now + time);
  }

  private clearPads() {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    this.padOscs.forEach(({ osc, gain, lfo }) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.stop(now + 0.7);
        lfo.stop(now + 0.7);
      } catch {}
    });
    this.padOscs = [];
  }

  private buildPads(cfg: AmbientCfg) {
    const c = getCtx();
    if (!c || !this.filter) return;
    this.filter.frequency.cancelScheduledValues(c.currentTime);
    this.filter.frequency.linearRampToValueAtTime(cfg.cutoff, c.currentTime + 1.5);
    cfg.pad.forEach((freq, i) => {
      const osc = c.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const gain = c.createGain();
      gain.gain.value = 0;
      // slow gentle LFO for subtle movement
      const lfo = c.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.06 + i * 0.025;
      const lfoGain = c.createGain();
      lfoGain.gain.value = freq * 0.0035; // tiny pitch wobble
      lfo.connect(lfoGain).connect(osc.frequency);
      osc.connect(gain).connect(this.filter!);
      const now = c.currentTime;
      const peak = 0.11 / cfg.pad.length + 0.04;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peak, now + 2.5 + i * 0.4);
      osc.start(now);
      lfo.start(now);
      this.padOscs.push({ osc, gain, lfo, lfoGain });
    });
  }

  private scheduleSparkle = () => {
    if (!this.current) return;
    const cfg = ATMOS[this.current];
    const [lo, hi] = cfg.sparkleEvery;
    const wait = (lo + Math.random() * (hi - lo)) * 1000;
    this.sparkleTimer = window.setTimeout(() => {
      this.playSparkle(cfg);
      this.scheduleSparkle();
    }, wait);
  };

  private playSparkle(cfg: AmbientCfg) {
    const c = getCtx();
    if (!c || !this.filter) return;
    const freq = cfg.sparklePool[Math.floor(Math.random() * cfg.sparklePool.length)];
    const osc = c.createOscillator();
    osc.type = cfg.wave;
    osc.frequency.value = freq;
    const g = c.createGain();
    const now = c.currentTime;
    const total = cfg.sparkleAttack + cfg.sparkleRelease;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(cfg.sparklePeak, now + cfg.sparkleAttack);
    g.gain.exponentialRampToValueAtTime(0.0005, now + total);
    osc.connect(g).connect(this.filter);
    osc.start(now);
    osc.stop(now + total + 0.1);
  }

  play(track: MusicTrack) {
    if (track === this.current && this.padOscs.length) {
      this.rampVolume(this.targetVolume(), 0.4);
      return;
    }
    this.stopInternal(0.5);
    if (!track || !settings.musicOn) {
      this.current = track;
      return;
    }
    const c = this.ensureChain();
    if (!c) return;
    this.current = track;
    this.buildPads(ATMOS[track]);
    this.rampVolume(this.targetVolume(), 1.2);
    if (this.sparkleTimer) clearTimeout(this.sparkleTimer);
    this.scheduleSparkle();
  }

  private stopInternal(fade = 0.4) {
    if (this.sparkleTimer) {
      clearTimeout(this.sparkleTimer);
      this.sparkleTimer = null;
    }
    this.rampVolume(0, fade);
    setTimeout(() => this.clearPads(), fade * 1000 + 50);
  }

  stop(fade = 0.4) {
    this.stopInternal(fade);
    this.current = null;
  }

  refresh() {
    if (!settings.musicOn) {
      // pause but remember current
      if (this.sparkleTimer) {
        clearTimeout(this.sparkleTimer);
        this.sparkleTimer = null;
      }
      this.rampVolume(0, 0.4);
      setTimeout(() => this.clearPads(), 500);
      return;
    }
    if (this.current && !this.padOscs.length) {
      // resume
      const desired = this.current;
      this.current = null;
      this.play(desired);
      return;
    }
    this.rampVolume(this.targetVolume(), 0.3);
  }

  // ----- Visibility / focus handling -----
  handleVisibilityChange(hidden: boolean) {
    if (hidden) {
      if (this.padOscs.length) {
        this.pausedByVisibility = true;
        if (this.sparkleTimer) {
          clearTimeout(this.sparkleTimer);
          this.sparkleTimer = null;
        }
        this.rampVolume(0, 0.2);
        setTimeout(() => this.clearPads(), 250);
      }
    } else if (this.pausedByVisibility) {
      this.pausedByVisibility = false;
      if (this.current && settings.musicOn) {
        const desired = this.current;
        this.current = null;
        this.play(desired);
      }
    }
  }
}

const ambient = new AmbientEngine();

export const setMusicTrack = (track: MusicTrack) => {
  ambient.play(track);
};

export const stopMusic = () => {
  ambient.stop();
};

// Pause/resume on backgrounding
if (typeof window !== "undefined") {
  const onHide = () => ambient.handleVisibilityChange(true);
  const onShow = () => ambient.handleVisibilityChange(false);
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
  out.gain.value = 0.9;
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
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.09, now + 0.02);
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
  playTactile(0.045, 800, 0.07);
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
  seq.forEach(([f, d]) => {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    const g = c.createGain();
    const start = now + d;
    const dur = 0.55;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.09, start + 0.02);
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

export const playKeypad = () => {
  if (!settings.keypadOn) return;
  const c = getCtx();
  const buf = getNoise();
  if (!c || !buf) return;
  const now = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = buf;
  const offset = Math.random() * Math.max(0, buf.duration - 0.03);

  // High-pass removes low-end thump; low-pass removes harsh treble.
  // Together they produce a clean mid-range click — crisp, not drum-like.
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 700;
  hp.Q.value = 0.5;

  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 4000;
  lp.Q.value = 0.6;

  const g = c.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.045, now + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0005, now + 0.022);

  src.connect(hp).connect(lp).connect(g).connect(c.destination);
  src.start(now, offset);
  src.stop(now + 0.028);
};

// ============================================================
// Haptics
// ============================================================
type HapticKind = "key" | "tap" | "correct" | "wrong" | "star" | "button";

export const haptic = (kind: HapticKind = "tap") => {
  if (!settings.hapticsOn) return;
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (typeof nav.vibrate !== "function") return;
  const map: Record<HapticKind, number | number[]> = {
    key: 8,
    tap: 10,
    button: 14,
    correct: 14,
    wrong: [18, 6, 18],
    star: [12, 40, 18],
  };
  try {
    nav.vibrate(map[kind]);
  } catch {}
};
