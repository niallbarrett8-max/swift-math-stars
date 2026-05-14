import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { StatsBar } from "./StatsBar";
import { QuestionCard, Feedback } from "./QuestionCard";
import {
  Difficulty,
  DIFFICULTY_MAX,
  TimerOption,
  calcAccuracy,
  generateQuestion,
} from "@/lib/game";
import { playCorrect, playWrong } from "@/lib/sound";

interface GameScreenProps {
  difficulty: Difficulty;
  timer: TimerOption;
  soundOn: boolean;
  onEnd: (result: { score: number; total: number; accuracy: number }) => void;
  onQuit: () => void;
}

export const GameScreen = ({ difficulty, timer, soundOn, onEnd, onQuit }: GameScreenProps) => {
  const max = DIFFICULTY_MAX[difficulty];
  const [question, setQuestion] = useState(() => generateQuestion(max));
  const [questionKey, setQuestionKey] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(timer);
  const endedRef = useRef(false);
  const stateRef = useRef({ score: 0, total: 0 });
  stateRef.current = { score, total };

  useEffect(() => {
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(id);
          if (!endedRef.current) {
            endedRef.current = true;
            const s = stateRef.current;
            onEnd({ score: s.score, total: s.total, accuracy: calcAccuracy(s.score, s.total) });
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [onEnd]);

  const handleSubmit = (answer: number) => {
    if (feedback || timeLeft === 0) return;
    const correct = question.a * question.b;
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

    window.setTimeout(() => {
      setFeedback(null);
      setQuestion((prev) => generateQuestion(max, prev));
      setQuestionKey((k) => k + 1);
    }, isCorrect ? 700 : 1300);
  };

  return (
    <div className="w-full max-w-2xl space-y-4 animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gradient">Math Stars</h2>
        <Button
          onClick={onQuit}
          variant="outline"
          className="rounded-2xl border-2 font-bold hover:scale-105 transition-all"
          aria-label="Quit game"
        >
          <X className="size-4 mr-1" /> Quit
        </Button>
      </div>
      <StatsBar
        score={score}
        accuracy={calcAccuracy(score, total)}
        timeLeft={timeLeft}
        totalTime={timer}
      />
      <QuestionCard
        a={question.a}
        b={question.b}
        feedback={feedback}
        onSubmit={handleSubmit}
        questionKey={questionKey}
      />
    </div>
  );
};
