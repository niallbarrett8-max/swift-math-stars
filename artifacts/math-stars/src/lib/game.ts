export type Difficulty = "easy" | "medium" | "hard";
export type TimerOption = 30 | 60 | 120 | 300 | 600 | "endless";
export type TargetScore = 10 | 25 | 50 | 75 | 100 | "endless";
export type Operation = "add" | "sub" | "mul" | "div";
export type AdventureDifficulty = "easy" | "medium" | "hard";
export type StarTier = "bronze" | "silver" | "gold";

export interface Question {
  a: number;
  b: number;
  op: Operation;
  answer: number;
}

export const OP_SYMBOL: Record<Operation, string> = {
  add: "+",
  sub: "−",
  mul: "×",
  div: "÷",
};

export const OP_LABEL: Record<Operation, string> = {
  add: "Addition",
  sub: "Subtraction",
  mul: "Multiplication",
  div: "Division",
};

const MUL_DIV_MAX: Record<Difficulty, number> = { easy: 5, medium: 10, hard: 12 };
const ADD_SUB_MAX: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 50 };

// Adventure (Daily Math Challenge) rules
const ADV_ADD_SUB_MAX: Record<AdventureDifficulty, number> = { easy: 5, medium: 20, hard: 50 };
const ADV_MUL_DIV_MAX: Record<AdventureDifficulty, number> = { easy: 5, medium: 10, hard: 12 };

export const STORAGE_KEYS = {
  highScore: "mathstars.highScore.v2",
  sound: "mathstars.sound",
  difficulty: "mathstars.difficulty",
  timer: "mathstars.timer",
  target: "mathstars.target",
  operation: "mathstars.operation",
  practiceOp: "mathstars.practice.op",
  practiceFamily: "mathstars.practice.family",
  adventureDiff: "mathstars.adventure.diff",
};

export const TIMER_OPTIONS: { value: TimerOption; label: string }[] = [
  { value: 30, label: "30s" },
  { value: 60, label: "60s" },
  { value: 120, label: "120s" },
  { value: 300, label: "5 min" },
  { value: 600, label: "10 min" },
  { value: "endless", label: "♾️ Endless" },
];

export const TARGET_OPTIONS: { value: TargetScore; label: string }[] = [
  { value: 10, label: "10" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
  { value: 75, label: "75" },
  { value: 100, label: "100" },
  { value: "endless", label: "♾️" },
];

export const highScoreKey = (op: Operation, diff: Difficulty, timer: TimerOption) =>
  `${STORAGE_KEYS.highScore}.${op}.${diff}.${timer}`;

const rand = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));

const sameQ = (a: Question | undefined, b: Question) =>
  !!a && a.op === b.op && a.a === b.a && a.b === b.b;

const buildOne = (op: Operation, diff: Difficulty): Question => {
  if (op === "mul") {
    const max = MUL_DIV_MAX[diff];
    const a = rand(1, max);
    const b = rand(1, max);
    return { a, b, op, answer: a * b };
  }
  if (op === "div") {
    const max = MUL_DIV_MAX[diff];
    const b = rand(1, max);
    const quotient = rand(1, max);
    return { a: b * quotient, b, op, answer: quotient };
  }
  if (op === "add") {
    const max = ADD_SUB_MAX[diff];
    const a = rand(1, max);
    const b = rand(1, max);
    return { a, b, op, answer: a + b };
  }
  const max = ADD_SUB_MAX[diff];
  const a = rand(1, max);
  const b = rand(1, a);
  return { a, b, op, answer: a - b };
};

export const generateQuestion = (op: Operation, diff: Difficulty, prev?: Question): Question => {
  for (let i = 0; i < 8; i++) {
    const q = buildOne(op, diff);
    if (!sameQ(prev, q)) return q;
  }
  return buildOne(op, diff);
};

/** Adventure: mixed random operation, ranges per adventure difficulty. */
const buildAdventure = (diff: AdventureDifficulty): Question => {
  const ops: Operation[] = ["add", "sub", "mul", "div"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  if (op === "mul") {
    const m = ADV_MUL_DIV_MAX[diff];
    const a = rand(1, m),
      b = rand(1, m);
    return { a, b, op, answer: a * b };
  }
  if (op === "div") {
    const m = ADV_MUL_DIV_MAX[diff];
    const b = rand(1, m),
      q = rand(1, m);
    return { a: b * q, b, op, answer: q };
  }
  if (op === "add") {
    const m = ADV_ADD_SUB_MAX[diff];
    const a = rand(1, m),
      b = rand(1, m);
    return { a, b, op, answer: a + b };
  }
  const m = ADV_ADD_SUB_MAX[diff];
  const a = rand(1, m);
  const b = rand(1, a);
  return { a, b, op, answer: a - b };
};

export const generateAdventureQuestion = (
  diff: AdventureDifficulty,
  prev?: Question,
): Question => {
  for (let i = 0; i < 8; i++) {
    const q = buildAdventure(diff);
    if (!sameQ(prev, q)) return q;
  }
  return buildAdventure(diff);
};

export const calcAccuracy = (correct: number, total: number) =>
  total === 0 ? 100 : Math.round((correct / total) * 100);

export const familyMax = (op: Operation) => (op === "mul" || op === "div" ? 12 : 10);

export const buildPracticeFamily = (op: Operation, k: number): Question[] => {
  const max = familyMax(op);
  const out: Question[] = [];
  if (op === "add") {
    for (let i = 1; i <= max; i++) out.push({ a: k, b: i, op, answer: k + i });
  } else if (op === "sub") {
    for (let i = 1; i <= max; i++) out.push({ a: k + i, b: i, op, answer: k });
  } else if (op === "mul") {
    for (let i = 1; i <= max; i++) out.push({ a: k, b: i, op, answer: k * i });
  } else {
    for (let i = 1; i <= max; i++) out.push({ a: k * i, b: k, op, answer: i });
  }
  return out;
};

// ===== Adventure star tiers / challenge constants =====
export const ADVENTURE_DURATION = 60; // seconds
export const STAR_GOALS: Record<StarTier, number> = { bronze: 5, silver: 10, gold: 15 };
export const STAR_ORDER: StarTier[] = ["bronze", "silver", "gold"];

export const starsForScore = (score: number): 0 | 1 | 2 | 3 => {
  if (score >= STAR_GOALS.gold) return 3;
  if (score >= STAR_GOALS.silver) return 2;
  if (score >= STAR_GOALS.bronze) return 1;
  return 0;
};

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// ===== Star + High Score record keys (per profile via pkey wrapper) =====
// Best (lowest) completion time in seconds for a star tier on a date.
// Legacy key (difficulty-agnostic). Kept for backward-compat reads; new writes use starTimeDiffKey.
export const starTimeKey = (date: string, tier: StarTier) => `adv.${date}.star.${tier}`;
// Per-difficulty star completion time — includes the adventure difficulty level.
export const starTimeDiffKey = (date: string, diff: AdventureDifficulty, tier: StarTier) =>
  `adv.${date}.${diff}.star.${tier}`;
// Best high-score (correct) and matching accuracy for a date.
export const hsScoreKey = (date: string) => `adv.${date}.hs.score`;
export const hsAccKey = (date: string) => `adv.${date}.hs.acc`;

// All-time unlock keys (tier earned at least once on this profile).
export const tierUnlockedKey = (tier: StarTier) => `adv.unlocked.${tier}`;

// Legacy (kept for backward-compat read; no longer written).
export const adventureDayKey = (date: string, diff: AdventureDifficulty) =>
  `adventure.${date}.${diff}`;

// Star tier visual colors (HSL components for inline styling).
export const STAR_COLORS: Record<StarTier, { fill: string; stroke: string; label: string }> = {
  bronze: { fill: "hsl(22 90% 56%)", stroke: "hsl(22 80% 36%)", label: "Bronze" },
  silver: { fill: "hsl(210 30% 86%)", stroke: "hsl(210 25% 58%)", label: "Silver" },
  gold: { fill: "hsl(42 100% 60%)", stroke: "hsl(38 90% 40%)", label: "Gold" },
};
