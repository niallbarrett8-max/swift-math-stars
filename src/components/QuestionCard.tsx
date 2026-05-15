import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { Operation, OP_SYMBOL } from "@/lib/game";

export type Feedback = { type: "correct" | "wrong"; correctAnswer: number } | null;

interface QuestionCardProps {
  a: number;
  b: number;
  op: Operation;
  feedback: Feedback;
  onSubmit: (answer: number) => void;
  questionKey: number;
}

export const QuestionCard = ({ a, b, op, feedback, onSubmit, questionKey }: QuestionCardProps) => {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue("");
    inputRef.current?.focus();
  }, [questionKey]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (feedback || value.trim() === "") return;
    const n = Number(value);
    if (Number.isNaN(n)) return;
    onSubmit(n);
  };

  const disabled = !!feedback;

  return (
    <div className="gradient-card rounded-3xl shadow-card p-6 sm:p-10 w-full">
      <div className="text-center mb-6">
        <p className="text-sm sm:text-base font-bold text-muted-foreground uppercase tracking-wider mb-3">
          What is...
        </p>
        <div
          key={questionKey}
          className="animate-soft-fade text-5xl sm:text-7xl font-extrabold text-gradient leading-none flex items-center justify-center gap-3 sm:gap-5 flex-wrap"
        >
          <span>{a}</span>
          <span className="text-foreground/60">{OP_SYMBOL[op]}</span>
          <span>{b}</span>
          <span className="text-foreground/60">=</span>
          <span className="text-foreground/40">?</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <label htmlFor="answer-input" className="sr-only">
          Your answer
        </label>
        <input
          id="answer-input"
          ref={inputRef}
          type="number"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder="Type answer..."
          className="flex-1 text-center text-3xl sm:text-4xl font-extrabold rounded-2xl border-4 border-border bg-background px-4 py-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all disabled:opacity-70"
          aria-label={`What is ${a} ${OP_SYMBOL[op]} ${b}?`}
        />
        <button
          type="submit"
          disabled={disabled || value.trim() === ""}
          className="btn-3d text-xl px-8 py-4"
        >
          Submit
        </button>
      </form>

      <div className="mt-6 h-16 flex items-center justify-center" aria-live="polite">
        {feedback && (
          <div
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xl sm:text-2xl font-extrabold animate-soft-fade ${
              feedback.type === "correct"
                ? "gradient-success text-white shadow-soft"
                : "bg-destructive text-destructive-foreground shadow-soft"
            }`}
          >
            {feedback.type === "correct" ? (
              <>
                <Check className="size-7" strokeWidth={3} /> Correct!
              </>
            ) : (
              <>
                <X className="size-7" strokeWidth={3} /> Answer: {feedback.correctAnswer}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
