import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { StatsBar } from "./StatsBar";
import { QuestionCard, Feedback } from "./QuestionCard";
import {
  Difficulty,
  Operation,
  Question,
  TimerOption,
  buildPracticeSet,
  calcAccuracy,
  generateQuestion,
} from "@/lib/game";
import { playCorrect, playWrong } from "@/lib/sound";

export interface GameResult {
  score: number;
  total: number;
  accuracy: number;
  practice: boolean;
}

interface GameScreenProps {
  operation: Operation;
  difficulty: Difficulty;
  timer: TimerOption | "practice";
  soundOn: boolean;
  onEnd: (result: GameResult) => void;
  onQuit: () => void;
}

export const GameScreen = ({
  operation,
  difficulty,
  timer,
  soundOn,
  onEnd,
  onQuit,
}: GameScreenProps) => {
  const isPractice = timer === "practice";
  const practiceSet = useRef<Question[]>(isPractice ? buildPracticeSet(operation) : []);
  const [practiceIdx, setPracticeIdx] = useState(0);

  const [question, setQuestion] = useState<Question>(() =>
    isPractice ? practiceSet.current[0] : generateQuestion(operation, difficulty),
  );
  const [questionKey, setQuestionKey] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const totalSeconds = isPractice ? 0 : (timer as number);
  const [timeLeft, setTimeLeft] = useState<number>(totalSeconds);

  const endedRef = useRef(false);
  const stateRef = useRef({ score: 0, total: 0 });
  stateRef.current = { score, total };

  const finish = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    const s = stateRef.current;
    onEnd({
      score: s.score,
      total: s.total,
      accuracy: calcAccuracy(s.score, s.total),
      practice: isPractice,
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

  const handleSubmit = (answer: number) => {
    if (feedback || (!isPractice && timeLeft === 0)) return;
    const correct = question.answer;
    const isCorrect = answer === correct;

    setTotal((t) => t + 1);
    if (isCorrect) {
      setScore((s) => s + 1);
      setFeedback({ type: "correct", correctAnswer: correct });
      if (soundOn) playCorrect();
    } else {
      setFeedback({ type: "wrong", correctAnswer: correct });
      if (soundOn) playWrong();
    }

    window.setTimeout(
      () => {
        setFeedback(null);
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
        setQuestionKey((k) => k + 1);
      },
      isCorrect ? 700 : 1300,
    );
  };

  const total$ = practiceSet.current.length;
  const pct = isPractice ? Math.round(((practiceIdx) / total$) * 100) : 0;

  return (
    <div className="w-full max-w-2xl space-y-4 animate-soft-fade">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gradient">Math Stars</h2>
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
              Practice ·{" "}
              <span className="text-gradient">
                Question {practiceIdx + 1} / {total$}
              </span>
            </span>
            <span>
              Score: <span className="text-gradient">{score}</span> · Acc:{" "}
              <span className="text-gradient">{calcAccuracy(score, total)}%</span>
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
          accuracy={calcAccuracy(score, total)}
          timeLeft={timeLeft}
          totalTime={totalSeconds}
        />
      )}

      <QuestionCard
        a={question.a}
        b={question.b}
        op={question.op}
        feedback={feedback}
        onSubmit={handleSubmit}
        questionKey={questionKey}
      />
    </div>
  );
};
