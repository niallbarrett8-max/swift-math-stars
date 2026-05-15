import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { StatsBar } from "./StatsBar";
import { QuestionCard, Feedback } from "./QuestionCard";
import { Keypad } from "./Keypad";
import {
  Difficulty,
  Operation,
  Question,
  TimerOption,
  buildPracticeFamily,
  calcAccuracy,
  generateQuestion,
} from "@/lib/game";
import { playCorrect, playWrong } from "@/lib/sound";

export interface GameResult {
  score: number;
  total: number;
  accuracy: number;
  practice: boolean;
  family?: number;
  operation: Operation;
}

interface GameScreenProps {
  operation: Operation;
  difficulty: Difficulty;
  timer: TimerOption | "practice";
  practiceFamily?: number;
  soundOn: boolean;
  onEnd: (result: GameResult) => void;
  onQuit: () => void;
}

const ADVANCE_MS = 250;
const WRONG_FLASH_MS = 450;

export const GameScreen = ({
  operation,
  difficulty,
  timer,
  practiceFamily,
  soundOn,
  onEnd,
  onQuit,
}: GameScreenProps) => {
  const isPractice = timer === "practice";
  const practiceSet = useRef<Question[]>(
    isPractice && practiceFamily ? buildPracticeFamily(operation, practiceFamily) : [],
  );
  const [practiceIdx, setPracticeIdx] = useState(0);

  const [question, setQuestion] = useState<Question>(() =>
    isPractice ? practiceSet.current[0] : generateQuestion(operation, difficulty),
  );
  const [questionKey, setQuestionKey] = useState(0);
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const totalSeconds = isPractice ? 0 : (timer as number);
  const [timeLeft, setTimeLeft] = useState<number>(totalSeconds);

  const lockedRef = useRef(false);
  const endedRef = useRef(false);
  const stateRef = useRef({ score: 0, wrong: 0 });
  stateRef.current = { score, wrong };

  const finish = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    const s = stateRef.current;
    const total = s.score + s.wrong;
    onEnd({
      score: s.score,
      total,
      accuracy: calcAccuracy(s.score, total),
      practice: isPractice,
      family: practiceFamily,
      operation,
    });
  };

  useEffect(() => {
    if (isPractice) return;
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
  }, [isPractice]);

  const advance = () => {
    if (isPractice) {
      const next = practiceIdx + 1;
      if (next >= practiceSet.current.length) {
        finish();
        return;
      }
      setPracticeIdx(next);
      setQuestion(practiceSet.current[next]);
    } else {
      setQuestion((prev) => generateQuestion(operation, difficulty, prev));
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
      // Correct
      lockedRef.current = true;
      setScore((s) => s + 1);
      setFeedback({ type: "correct", correctAnswer: correct });
      if (soundOn) playCorrect();
      window.setTimeout(advance, ADVANCE_MS);
      return;
    }

    if (next.length >= correctStr.length) {
      // User reached/exceeded answer length without matching → wrong attempt
      lockedRef.current = true;
      setWrong((w) => w + 1);
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
    if (!isPractice && timeLeft === 0) return;
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

  // Keyboard support (desktop) — does not show iOS keyboard.
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
        <h2 className="text-xl sm:text-3xl font-extrabold text-gradient">Math Stars</h2>
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
      ) : (
        <StatsBar
          score={score}
          accuracy={calcAccuracy(score, score + wrong)}
          timeLeft={timeLeft}
          totalTime={totalSeconds}
        />
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
