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

// Multiplication / division are always limited to the 12 times tables.
const MUL_DIV_MAX: Record<Difficulty, number> = {
  easy: 5,
  medium: 10,
  hard: 12,
};

// Addition / subtraction operand caps (Easy is hard-capped at 10 by spec).
const ADD_SUB_MAX: Record<Difficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 50,
};

export const STORAGE_KEYS = {
  highScore: "mathstars.highScore.v2", // per op+difficulty key prefix
  sound: "mathstars.sound",
  difficulty: "mathstars.difficulty",
  timer: "mathstars.timer",
  operation: "mathstars.operation",
};

export const highScoreKey = (op: Operation, diff: Difficulty) =>
  `${STORAGE_KEYS.highScore}.${op}.${diff}`;

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
    // dividend = b * quotient, both 1..max → guarantees clean 12×-table division
    const b = rand(1, max);
    const quotient = rand(1, max);
    const a = b * quotient;
    return { a, b, op, answer: quotient };
  }
  if (op === "add") {
    const max = ADD_SUB_MAX[diff];
    const a = rand(1, max);
    const b = rand(1, max);
    return { a, b, op, answer: a + b };
  }
  // sub — ensure non-negative
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
  total === 0 ? 0 : Math.round((correct / total) * 100);

// ---- Practice mode (fact-family ordered sets, no timer) ----

export const buildPracticeSet = (op: Operation): Question[] => {
  const out: Question[] = [];
  if (op === "add") {
    for (let k = 1; k <= 10; k++)
      for (let i = 1; i <= 10; i++) out.push({ a: k, b: i, op, answer: k + i });
  } else if (op === "sub") {
    // family k: (k + i) - i = k, i = 1..10 → answer = k
    for (let k = 1; k <= 10; k++)
      for (let i = 1; i <= 10; i++) out.push({ a: k + i, b: i, op, answer: k });
  } else if (op === "mul") {
    for (let k = 1; k <= 12; k++)
      for (let i = 1; i <= 12; i++) out.push({ a: k, b: i, op, answer: k * i });
  } else {
    // div family k: (k * i) ÷ k = i, i = 1..12
    for (let k = 1; k <= 12; k++)
      for (let i = 1; i <= 12; i++) out.push({ a: k * i, b: k, op, answer: i });
  }
  return out;
};
