import { useEffect, useRef, useState } from "react";
import { X, Infinity as InfinityIcon, Flame, Sparkles } from "lucide-react";
import { StatsBar } from "./StatsBar";
import { QuestionCard, Feedback } from "./QuestionCard";
import { Keypad } from "./Keypad";
import {
  AdventureDifficulty,
  Difficulty,
  Operation,
  Question,
  TargetScore,
  TimerOption,
  buildPracticeFamily,
  calcAccuracy,
  generateAdventureQuestion,
  generateQuestion,
} from "@/lib/game";
import { playCorrect, playWrong } from "@/lib/sound";

export interface GameResult {
  score: number;
  total: number;
  accuracy: number;
  bestStreak: number;
  practice: boolean;
  family?: number;
  operation: Operation;
  targetReached?: boolean;
  targetScore?: TargetScore;
  // Adventure
  challenge?: AdventureDifficulty;
  starsEarned?: 0 | 1 | 2 | 3;
}

interface GameScreenProps {
  operation: Operation;
  difficulty: Difficulty;
  timer: TimerOption | "practice";
  practiceFamily?: number;
  targetScore?: TargetScore;
  challenge?: AdventureDifficulty;
  soundOn: boolean;
  onEnd: (result: GameResult) => void;
  onQuit: () => void;
}

const ADVANCE_MS = 250;
const WRONG_FLASH_MS = 450;

const formatTime = (s: number) => {
  if (s >= 60) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }
  return `${s}s`;
};

export const GameScreen = ({
  operation,
  difficulty,
  timer,
  practiceFamily,
  targetScore,
  challenge,
  soundOn,
  onEnd,
  onQuit,
}: GameScreenProps) => {
  const isPractice = timer === "practice";
  const isChallenge = !!challenge;
  const isEndlessTimer = timer === "endless";
  const isEndlessTarget = !targetScore || targetScore === "endless";

  const practiceSet = useRef<Question[]>(
    isPractice && practiceFamily ? buildPracticeFamily(operation, practiceFamily) : [],
  );
  const [practiceIdx, setPracticeIdx] = useState(0);

  const makeQ = (prev?: Question) =>
    isChallenge
      ? generateAdventureQuestion(challenge!, prev)
      : generateQuestion(operation, difficulty, prev);

  const [question, setQuestion] = useState<Question>(() =>
    isPractice ? practiceSet.current[0] : makeQ(),
  );
  const [questionKey, setQuestionKey] = useState(0);
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const totalSeconds =
    isPractice || isEndlessTimer ? 0 : (timer as number);
  const [timeLeft, setTimeLeft] = useState<number>(totalSeconds);

  const lockedRef = useRef(false);
  const endedRef = useRef(false);
  const stateRef = useRef({ score: 0, wrong: 0, bestStreak: 0 });
  stateRef.current = { score, wrong, bestStreak };

  const finish = (opts?: { targetReached?: boolean }) => {
    if (endedRef.current) return;
    endedRef.current = true;
    const s = stateRef.current;
    const total = s.score + s.wrong;
    let stars: 0 | 1 | 2 | 3 | undefined;
    if (isChallenge) {
      const { STAR_GOALS } = require("@/lib/game");
      stars = s.score >= STAR_GOALS.gold ? 3 : s.score >= STAR_GOALS.silver ? 2 : s.score >= STAR_GOALS.bronze ? 1 : 0;
    }
    onEnd({
      score: s.score,
      total,
      accuracy: calcAccuracy(s.score, total),
      bestStreak: s.bestStreak,
      practice: isPractice,
      family: practiceFamily,
      operation,
      targetReached: opts?.targetReached,
      targetScore,
      challenge: challenge,
      starsEarned: stars,
    });
  };

  // Countdown
  useEffect(() => {
    if (isPractice || isEndlessTimer) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(id);
          finish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPractice, isEndlessTimer]);

  const advance = (justScored: boolean) => {
    // Target reached?
    if (
      justScored &&
      !isPractice &&
      !isChallenge &&
      !isEndlessTarget &&
      typeof targetScore === "number" &&
      stateRef.current.score >= targetScore
    ) {
      finish({ targetReached: true });
      return;
    }
    if (isPractice) {
      const next = practiceIdx + 1;
      if (next >= practiceSet.current.length) {
        finish();
        return;
      }
      setPracticeIdx(next);
      setQuestion(practiceSet.current[next]);
    } else {
      setQuestion((prev) => makeQ(prev));
    }
    setValue("");
    setFeedback(null);
    setQuestionKey((k) => k + 1);
    lockedRef.current = false;
  };

  const tryEvaluate = (next: string) => {
    const correct = question.answer;
    const correctStr = String(correct);
    const n = Number(next);

    if (next.length > 0 && !Number.isNaN(n) && n === correct) {
      lockedRef.current = true;
      setScore((s) => s + 1);
      setStreak((st) => {
        const ns = st + 1;
        setBestStreak((b) => (ns > b ? ns : b));
        return ns;
      });
      setFeedback({ type: "correct", correctAnswer: correct });
      if (soundOn) playCorrect();
      window.setTimeout(() => advance(true), ADVANCE_MS);
      return;
    }

    if (next.length >= correctStr.length) {
      lockedRef.current = true;
      setWrong((w) => w + 1);
      setStreak(0);
      setFeedback({ type: "wrong", correctAnswer: correct });
      if (soundOn) playWrong();
      window.setTimeout(() => {
        setValue("");
        setFeedback(null);
        lockedRef.current = false;
      }, WRONG_FLASH_MS);
    }
  };

  const handleDigit = (d: string) => {
    if (lockedRef.current) return;
    if (!isPractice && !isEndlessTimer && timeLeft === 0) return;
    setValue((v) => {
      if (v.length >= 4) return v;
      const next = (v + d).replace(/^0+(?=\d)/, "");
      tryEvaluate(next);
      return next;
    });
  };

  const handleDelete = () => {
    if (lockedRef.current) return;
    setValue((v) => v.slice(0, -1));
  };

  const handleClear = () => {
    if (lockedRef.current) return;
    setValue("");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") handleDigit(e.key);
      else if (e.key === "Backspace") handleDelete();
      else if (e.key === "Escape" || e.key.toLowerCase() === "c") handleClear();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, value, timeLeft, isPractice]);

  const total$ = practiceSet.current.length;
  const pct = isPractice ? Math.round((practiceIdx / total$) * 100) : 0;

  return (
    <div className="w-full max-w-2xl space-y-4 animate-soft-fade">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl sm:text-3xl font-extrabold text-gradient">
          {isChallenge ? "Math Adventure" : "Hayley's Math Stars"}
        </h2>
        <button
          onClick={onQuit}
          className="btn-3d btn-3d-neutral px-4 py-2 text-sm"
          aria-label="Quit game"
        >
          <X className="size-4" /> Quit
        </button>
      </div>

      {isPractice ? (
        <div className="w-full gradient-card rounded-2xl p-3 sm:p-4 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-sm sm:text-base font-bold">
            <span>
              Family <span className="text-gradient">{practiceFamily}</span> ·{" "}
              <span className="text-gradient">
                {practiceIdx + 1} / {total$}
              </span>
            </span>
            <span>
              Score: <span className="text-gradient">{score}</span>
            </span>
          </div>
          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full gradient-primary rounded-full transition-all"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={practiceIdx}
              aria-valuemin={0}
              aria-valuemax={total$}
            />
          </div>
        </div>
      ) : isEndlessTimer ? (
        <div className="w-full gradient-card rounded-2xl p-3 sm:p-4 shadow-soft">
          <div className="flex items-center justify-between gap-2 flex-wrap text-sm sm:text-base font-extrabold">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full gradient-accent text-accent-foreground shadow-soft">
              <InfinityIcon className="size-4" /> Endless
            </span>
            <span>
              Score: <span className="text-gradient">{score}</span>
            </span>
            <span>
              Accuracy: <span className="text-gradient">{calcAccuracy(score, score + wrong)}%</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Flame className="size-4 text-accent" /> {streak}
            </span>
            <span className="text-muted-foreground">Answered: {score + wrong}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <StatsBar
            score={score}
            accuracy={calcAccuracy(score, score + wrong)}
            timeLeft={timeLeft}
            totalTime={totalSeconds}
          />
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-muted-foreground px-1">
            <span className="inline-flex items-center gap-1">
              <Flame className="size-4 text-accent" /> Streak {streak}{" "}
              <span className="opacity-70">· Best {bestStreak}</span>
            </span>
            {isChallenge ? (
              <span className="inline-flex items-center gap-1 text-accent-foreground">
                <Sparkles className="size-4" /> Challenge · {challenge}
              </span>
            ) : !isEndlessTarget ? (
              <span>
                Target: <span className="text-gradient">{score} / {targetScore}</span>
              </span>
            ) : (
              <span>Time: {formatTime(timeLeft)}</span>
            )}
          </div>
        </div>
      )}

      <QuestionCard
        a={question.a}
        b={question.b}
        op={question.op}
        value={value}
        feedback={feedback}
        questionKey={questionKey}
      />

      <Keypad onDigit={handleDigit} onDelete={handleDelete} onClear={handleClear} />
    </div>
  );
};
