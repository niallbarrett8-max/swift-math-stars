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

const tone = (freq: number, duration: number, type: OscillatorType = "sine", delay = 0) => {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
};

export const playCorrect = () => {
  tone(660, 0.12, "triangle", 0);
  tone(880, 0.18, "triangle", 0.1);
};

export const playWrong = () => {
  tone(220, 0.18, "sawtooth", 0);
  tone(160, 0.22, "sawtooth", 0.1);
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
