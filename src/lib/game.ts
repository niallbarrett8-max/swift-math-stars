export type Difficulty = "easy" | "medium" | "hard";
export type TimerOption = 30 | 60 | 120;

export const DIFFICULTY_MAX: Record<Difficulty, number> = {
  easy: 5,
  medium: 10,
  hard: 12,
};

export const STORAGE_KEYS = {
  highScore: "mathstars.highScore",
  sound: "mathstars.sound",
  difficulty: "mathstars.difficulty",
  timer: "mathstars.timer",
};

const rand = (max: number) => 1 + Math.floor(Math.random() * max);

export const generateQuestion = (
  max: number,
  prev?: { a: number; b: number },
): { a: number; b: number } => {
  for (let i = 0; i < 8; i++) {
    const a = rand(max);
    const b = rand(max);
    if (!prev || a !== prev.a || b !== prev.b) return { a, b };
  }
  return { a: rand(max), b: rand(max) };
};

export const calcAccuracy = (correct: number, total: number) =>
  total === 0 ? 0 : Math.round((correct / total) * 100);
