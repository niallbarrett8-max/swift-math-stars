export type Difficulty = "easy" | "medium" | "hard";
export type TimerOption = 30 | 60 | 120;
export type Operation = "add" | "sub" | "mul" | "div";

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

export const STORAGE_KEYS = {
  highScore: "mathstars.highScore.v2",
  sound: "mathstars.sound",
  difficulty: "mathstars.difficulty",
  timer: "mathstars.timer",
  operation: "mathstars.operation",
  practiceOp: "mathstars.practice.op",
  practiceFamily: "mathstars.practice.family",
};

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

export const generateQuestion = (
  op: Operation,
  diff: Difficulty,
  prev?: Question,
): Question => {
  for (let i = 0; i < 8; i++) {
    const q = buildOne(op, diff);
    if (!sameQ(prev, q)) return q;
  }
  return buildOne(op, diff);
};

export const calcAccuracy = (correct: number, total: number) =>
  total === 0 ? 100 : Math.round((correct / total) * 100);

// Practice fact-family ranges
export const familyMax = (op: Operation) =>
  op === "mul" || op === "div" ? 12 : 10;

// Build a practice set for one fact family k.
export const buildPracticeFamily = (op: Operation, k: number): Question[] => {
  const max = familyMax(op);
  const out: Question[] = [];
  if (op === "add") {
    for (let i = 1; i <= max; i++) out.push({ a: k, b: i, op, answer: k + i });
  } else if (op === "sub") {
    // minuend = k + i, subtrahend = i, answer = k (subtraction facts "for k")
    for (let i = 1; i <= max; i++) out.push({ a: k + i, b: i, op, answer: k });
  } else if (op === "mul") {
    for (let i = 1; i <= max; i++) out.push({ a: k, b: i, op, answer: k * i });
  } else {
    for (let i = 1; i <= max; i++) out.push({ a: k * i, b: k, op, answer: i });
  }
  return out;
};
