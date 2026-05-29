import { ArrowLeft, GraduationCap, Play } from "lucide-react";
import { Operation, OP_LABEL, OP_SYMBOL, buildPracticeFamily } from "@/lib/game";

interface LearnScreenProps {
  operation: Operation;
  family: number;
  onBack: () => void;
  onStartPractice: () => void;
}

export const LearnScreen = ({ operation, family, onBack, onStartPractice }: LearnScreenProps) => {
  const facts = buildPracticeFamily(operation, family);
  const sym = OP_SYMBOL[operation];

  return (
    <div className="w-full max-w-xl gradient-card rounded-3xl shadow-card p-6 sm:p-8 animate-soft-fade">
      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack} className="btn-3d btn-3d-neutral px-4 py-2 text-sm">
          <ArrowLeft className="size-4" /> Back
        </button>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full gradient-secondary text-white font-extrabold text-xs shadow-soft">
          <GraduationCap className="size-4" /> Learn Mode
        </div>
      </div>

      <h1 className="text-3xl sm:text-5xl font-extrabold text-gradient mb-2 text-center">
        {OP_LABEL[operation]} · {family}
      </h1>
      <p className="text-center text-muted-foreground font-semibold mb-6">
        Study the facts. No timer, no score — just learn!
      </p>

      <ol className="space-y-2 mb-6" aria-label={`${OP_LABEL[operation]} facts for ${family}`}>
        {facts.map((f, i) => (
          <li
            key={i}
            className="rounded-2xl bg-background border-4 border-border px-4 py-3 shadow-soft flex items-center justify-between"
          >
            <span className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
              <span className="text-muted-foreground text-sm w-6 text-right">{i + 1}.</span>
              <span>{f.a}</span>
              <span className="text-foreground/60">{sym}</span>
              <span>{f.b}</span>
              <span className="text-foreground/60">=</span>
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-gradient">{f.answer}</span>
          </li>
        ))}
      </ol>

      <button onClick={onStartPractice} className="btn-3d w-full text-xl py-4">
        <Play className="size-5" /> Practice These Facts
      </button>
    </div>
  );
};
