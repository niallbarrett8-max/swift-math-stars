import { Sparkles, Volume2, VolumeX, Plus, Minus, X as XIcon, Divide, Infinity as InfIcon } from "lucide-react";
import { Difficulty, Operation, OP_LABEL, TimerOption } from "@/lib/game";

export type TimerChoice = TimerOption | "practice";

interface SetupScreenProps {
  operation: Operation;
  difficulty: Difficulty;
  timer: TimerChoice;
  soundOn: boolean;
  highScore: number;
  onOperation: (o: Operation) => void;
  onDifficulty: (d: Difficulty) => void;
  onTimer: (t: TimerChoice) => void;
  onToggleSound: () => void;
  onStart: () => void;
}

const operations: { id: Operation; icon: typeof Plus; gradient: string }[] = [
  { id: "add", icon: Plus, gradient: "btn-3d-success" },
  { id: "sub", icon: Minus, gradient: "btn-3d-secondary" },
  { id: "mul", icon: XIcon, gradient: "" }, // primary default
  { id: "div", icon: Divide, gradient: "btn-3d-accent" },
];

const difficulties: { id: Difficulty; label: string; sub: string; cls: string }[] = [
  { id: "easy", label: "Easy", sub: "warm-up", cls: "btn-3d-success" },
  { id: "medium", label: "Medium", sub: "balanced", cls: "btn-3d-secondary" },
  { id: "hard", label: "Hard", sub: "challenge", cls: "" },
];

const timers: { id: TimerChoice; label: string }[] = [
  { id: 30, label: "30s" },
  { id: 60, label: "60s" },
  { id: 120, label: "120s" },
  { id: "practice", label: "Practice" },
];

export const SetupScreen = ({
  operation,
  difficulty,
  timer,
  soundOn,
  highScore,
  onOperation,
  onDifficulty,
  onTimer,
  onToggleSound,
  onStart,
}: SetupScreenProps) => {
  const subFor = (d: Difficulty) => {
    if (operation === "mul" || operation === "div") {
      return { easy: "1 – 5", medium: "1 – 10", hard: "1 – 12" }[d];
    }
    if (operation === "add" || operation === "sub") {
      return { easy: "1 – 10", medium: "1 – 20", hard: "1 – 50" }[d];
    }
    return "";
  };

  return (
    <div className="w-full max-w-2xl gradient-card rounded-3xl shadow-card p-6 sm:p-10 animate-soft-fade">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full gradient-accent text-accent-foreground font-bold text-sm mb-4 shadow-soft">
          <Sparkles className="size-4" /> Math Adventure
        </div>
        <h1 className="text-5xl sm:text-7xl font-extrabold text-gradient mb-3 leading-tight">
          Math Stars
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground font-semibold max-w-md mx-auto">
          Practice {OP_LABEL[operation].toLowerCase()} and beat your high score!
        </p>
        {highScore > 0 && timer !== "practice" && (
          <p className="mt-3 text-sm font-bold text-accent-foreground/80">
            🏆 Personal Best ({OP_LABEL[operation]} · {difficulty}):{" "}
            <span className="text-foreground">{highScore}</span>
          </p>
        )}
      </div>

      <section className="mb-6">
        <h2 className="text-lg font-extrabold mb-3">Pick an operation</h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {operations.map((o) => {
            const active = operation === o.id;
            const Icon = o.icon;
            return (
              <button
                key={o.id}
                onClick={() => onOperation(o.id)}
                aria-pressed={active}
                aria-label={OP_LABEL[o.id]}
                className={`btn-3d ${o.gradient} flex-col py-3 sm:py-4 text-xs sm:text-sm ${
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
        <h2 className="text-lg font-extrabold mb-3">Pick a difficulty</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {difficulties.map((d) => {
            const active = difficulty === d.id;
            return (
              <button
                key={d.id}
                onClick={() => onDifficulty(d.id)}
                aria-pressed={active}
                disabled={timer === "practice"}
                className={`btn-3d ${d.cls} flex-col py-3 sm:py-4 ${
                  active ? "btn-3d-active-ring" : "opacity-75"
                }`}
              >
                <span className="text-base sm:text-xl">{d.label}</span>
                <span className="text-xs sm:text-sm opacity-90">{subFor(d.id)}</span>
              </button>
            );
          })}
        </div>
        {timer === "practice" && (
          <p className="text-xs text-muted-foreground font-semibold mt-2 text-center">
            Practice mode covers full fact families — difficulty isn't used.
          </p>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-extrabold mb-3">Choose your mode</h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {timers.map((t) => {
            const active = timer === t.id;
            const isPractice = t.id === "practice";
            return (
              <button
                key={String(t.id)}
                onClick={() => onTimer(t.id)}
                aria-pressed={active}
                className={`btn-3d ${isPractice ? "btn-3d-accent" : "btn-3d-secondary"} flex-col py-3 sm:py-4 text-sm sm:text-base ${
                  active ? "btn-3d-active-ring" : "opacity-75"
                }`}
              >
                {isPractice ? <InfIcon className="size-5" strokeWidth={3} /> : null}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <button
        onClick={onToggleSound}
        className="w-full mb-6 flex items-center justify-between gap-3 rounded-2xl bg-background border-4 border-border px-5 py-3 font-bold hover:border-primary/40 transition-all"
        aria-pressed={soundOn}
      >
        <span className="flex items-center gap-3">
          {soundOn ? (
            <Volume2 className="size-5 text-primary" />
          ) : (
            <VolumeX className="size-5 text-muted-foreground" />
          )}
          Sound effects
        </span>
        <span
          className={`text-sm px-3 py-1 rounded-full font-extrabold ${
            soundOn ? "gradient-success text-white" : "bg-muted text-muted-foreground"
          }`}
        >
          {soundOn ? "ON" : "OFF"}
        </span>
      </button>

      <button onClick={onStart} className="btn-3d w-full text-2xl py-5">
        {timer === "practice" ? "Start Practice →" : "Start Game →"}
      </button>
    </div>
  );
};
