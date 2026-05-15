import { useState } from "react";
import { ArrowLeft, Plus, Minus, X as XIcon, Divide, GraduationCap } from "lucide-react";
import { Operation, OP_LABEL, familyMax } from "@/lib/game";

interface PracticeSetupScreenProps {
  initialOperation: Operation;
  initialFamily: number;
  onBack: () => void;
  onStart: (op: Operation, family: number) => void;
}

const operations: { id: Operation; icon: typeof Plus; cls: string }[] = [
  { id: "add", icon: Plus, cls: "btn-3d-success" },
  { id: "sub", icon: Minus, cls: "btn-3d-secondary" },
  { id: "mul", icon: XIcon, cls: "" },
  { id: "div", icon: Divide, cls: "btn-3d-accent" },
];

export const PracticeSetupScreen = ({
  initialOperation,
  initialFamily,
  onBack,
  onStart,
}: PracticeSetupScreenProps) => {
  const [op, setOp] = useState<Operation>(initialOperation);
  const max = familyMax(op);
  const [family, setFamily] = useState<number>(
    Math.min(Math.max(initialFamily || 1, 1), max),
  );

  const setOperation = (next: Operation) => {
    setOp(next);
    const m = familyMax(next);
    if (family > m) setFamily(m);
  };

  const numbers = Array.from({ length: max }, (_, i) => i + 1);
  const exampleA = op === "div" ? family * 1 : family;
  const exampleB = 1;
  const exampleAns =
    op === "add" ? family + 1 : op === "sub" ? family : op === "mul" ? family : 1;
  const exampleSym = { add: "+", sub: "−", mul: "×", div: "÷" }[op];

  return (
    <div className="w-full max-w-2xl gradient-card rounded-3xl shadow-card p-6 sm:p-10 animate-soft-fade">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="btn-3d btn-3d-neutral px-4 py-2 text-sm">
          <ArrowLeft className="size-4" /> Back
        </button>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full gradient-accent text-accent-foreground font-extrabold text-xs shadow-soft">
          <GraduationCap className="size-4" /> Practice Mode
        </div>
      </div>

      <h1 className="text-3xl sm:text-5xl font-extrabold text-gradient mb-2 text-center">
        Practice a fact family
      </h1>
      <p className="text-center text-muted-foreground font-semibold mb-6">
        Pick an operation and a number — go through every fact at your own pace.
      </p>

      <section className="mb-6">
        <h2 className="text-lg font-extrabold mb-3">1. Choose operation</h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {operations.map((o) => {
            const active = op === o.id;
            const Icon = o.icon;
            return (
              <button
                key={o.id}
                onClick={() => setOperation(o.id)}
                aria-pressed={active}
                aria-label={OP_LABEL[o.id]}
                className={`btn-3d ${o.cls} flex-col py-3 sm:py-4 text-xs sm:text-sm ${
                  active ? "btn-3d-active-ring" : "opacity-70"
                }`}
              >
                <Icon className="size-6 sm:size-7" strokeWidth={3} />
                <span className="hidden sm:block">{OP_LABEL[o.id]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-extrabold mb-3">
          2. Choose a number{" "}
          <span className="text-sm text-muted-foreground font-bold">(1 – {max})</span>
        </h2>
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
          {numbers.map((n) => {
            const active = family === n;
            return (
              <button
                key={n}
                onClick={() => setFamily(n)}
                aria-pressed={active}
                className={`btn-3d ${active ? "btn-3d-active-ring" : "btn-3d-neutral opacity-90"} h-12 sm:h-14 text-xl sm:text-2xl`}
              >
                {n}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-center text-sm font-bold text-muted-foreground">
          Example: <span className="text-foreground">{exampleA} {exampleSym} {exampleB} = {exampleAns}</span>
        </p>
      </section>

      <button onClick={() => onStart(op, family)} className="btn-3d w-full text-2xl py-5">
        Start Practice →
      </button>
    </div>
  );
};
