let ctx: AudioContext | null = null;

const getCtx = () => {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
};

const tone = (
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  delay = 0,
  peak = 0.18,
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
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
};

// Upbeat, bell-like ascending arpeggio (C-E-G-C). Soft sine layers feel rewarding without harshness.
export const playCorrect = () => {
  const notes = [
    { f: 523.25, d: 0.18 }, // C5
    { f: 659.25, d: 0.18 }, // E5
    { f: 783.99, d: 0.22 }, // G5
    { f: 1046.5, d: 0.45 }, // C6 sustained shimmer
  ];
  let t = 0;
  notes.forEach((n, i) => {
    tone(n.f, n.d, "sine", t, 0.16);
    // gentle harmonic shimmer an octave up
    tone(n.f * 2, n.d * 0.9, "sine", t, 0.04);
    t += i === notes.length - 2 ? 0.1 : 0.08;
  });
};

export const playWrong = () => {
  tone(220, 0.18, "sine", 0, 0.14);
  tone(165, 0.22, "sine", 0.1, 0.14);
};

export const playStart = () => {
  tone(523, 0.1, "triangle", 0);
  tone(659, 0.1, "triangle", 0.08);
  tone(784, 0.18, "triangle", 0.16);
};

export const playEnd = () => {
  tone(784, 0.15, "triangle", 0);
  tone(523, 0.25, "triangle", 0.15);
};
