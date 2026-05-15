import { useEffect } from "react";
import { Check, X } from "lucide-react";
import { Operation, OP_SYMBOL } from "@/lib/game";

export type Feedback = { type: "correct" | "wrong"; correctAnswer: number } | null;

interface QuestionCardProps {
  a: number;
  b: number;
  op: Operation;
  value: string;
  feedback: Feedback;
  questionKey: number;
}

export const QuestionCard = ({
  a,
  b,
  op,
  value,
  feedback,
  questionKey,
}: QuestionCardProps) => {
  // Keep the URL/state in sync with the active question, no native input here.
  useEffect(() => {}, [questionKey]);

  const display = value === "" ? "?" : value;
  const wrong = feedback?.type === "wrong";
  const correct = feedback?.type === "correct";

  return (
    <div className="gradient-card rounded-3xl shadow-card p-5 sm:p-8 w-full">
      <div className="text-center">
        <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
          What is...
        </p>
        <div
          key={questionKey}
          className="animate-soft-fade text-4xl sm:text-6xl font-extrabold text-gradient leading-none flex items-center justify-center gap-3 sm:gap-4 flex-wrap"
        >
          <span>{a}</span>
          <span className="text-foreground/60">{OP_SYMBOL[op]}</span>
          <span>{b}</span>
          <span className="text-foreground/60">=</span>
          <span
            aria-live="polite"
            className={`min-w-[2ch] inline-block rounded-2xl px-4 py-1 transition-colors ${
              correct
                ? "gradient-success text-white"
                : wrong
                  ? "bg-destructive text-destructive-foreground animate-soft-fade"
                  : value
                    ? "text-foreground"
                    : "text-foreground/30"
            }`}
          >
            {display}
          </span>
        </div>

        <div className="mt-4 h-8 flex items-center justify-center" aria-live="polite">
          {correct && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl gradient-success text-white font-extrabold text-sm sm:text-base shadow-soft animate-soft-fade">
              <Check className="size-5" strokeWidth={3} /> Correct!
            </span>
          )}
          {wrong && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-destructive text-destructive-foreground font-extrabold text-sm sm:text-base shadow-soft animate-soft-fade">
              <X className="size-5" strokeWidth={3} /> Try again
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
