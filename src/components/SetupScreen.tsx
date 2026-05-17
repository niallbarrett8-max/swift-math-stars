import { Sparkles, Volume2, VolumeX, Plus, Minus, X as XIcon, Divide, GraduationCap } from "lucide-react";
import { Difficulty, Operation, OP_LABEL, TimerOption } from "@/lib/game";
import { ProfileSelector } from "./ProfileSelector";

interface SetupScreenProps {
  operation: Operation;
  difficulty: Difficulty;
  timer: TimerOption;
  soundOn: boolean;
  highScore: number;
  activeProfileId: string;
  onProfileChange: (id: string) => void;
  onOperation: (o: Operation) => void;
  onDifficulty: (d: Difficulty) => void;
  onTimer: (t: TimerOption) => void;
  onToggleSound: () => void;
  onStart: () => void;
  onPracticeMode: () => void;
}

const operations: { id: Operation; icon: typeof Plus; gradient: string }[] = [
  { id: "add", icon: Plus, gradient: "btn-3d-success" },
  { id: "sub", icon: Minus, gradient: "btn-3d-secondary" },
  { id: "mul", icon: XIcon, gradient: "" },
  { id: "div", icon: Divide, gradient: "btn-3d-accent" },
];

const difficulties: { id: Difficulty; label: string; cls: string }[] = [
  { id: "easy", label: "Easy", cls: "btn-3d-success" },
  { id: "medium", label: "Medium", cls: "btn-3d-secondary" },
  { id: "hard", label: "Hard", cls: "" },
];

const timers: TimerOption[] = [30, 60, 120];

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
  onPracticeMode,
}: SetupScreenProps) => {
  const subFor = (d: Difficulty) => {
    if (operation === "mul" || operation === "div")
      return { easy: "1 – 5", medium: "1 – 10", hard: "1 – 12" }[d];
    return { easy: "1 – 10", medium: "1 – 20", hard: "1 – 50" }[d];
  };

  return (
    <div className="w-full max-w-2xl gradient-card rounded-3xl shadow-card p-6 sm:p-10 animate-soft-fade">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full gradient-accent text-accent-foreground font-bold text-sm mb-4 shadow-soft">
          <Sparkles className="size-4" /> Math Adventure
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gradient mb-3 leading-tight">
          Hayley's Math Stars
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground font-semibold max-w-md mx-auto">
          Practice {OP_LABEL[operation].toLowerCase()} and beat your high score!
        </p>
        {highScore > 0 && (
          <p className="mt-3 text-sm font-bold text-accent-foreground/80">
            🏆 Personal Best ({OP_LABEL[operation]} · {difficulty} · {timer}s):{" "}
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
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-extrabold mb-3">Choose game length</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {timers.map((t) => {
            const active = timer === t;
            return (
              <button
                key={t}
                onClick={() => onTimer(t)}
                aria-pressed={active}
                className={`btn-3d btn-3d-secondary flex-col py-3 sm:py-4 text-base sm:text-lg ${
                  active ? "btn-3d-active-ring" : "opacity-75"
                }`}
              >
                {t}s
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

      <button onClick={onStart} className="btn-3d w-full text-2xl py-5 mb-3">
        Start Game →
      </button>
      <button onClick={onPracticeMode} className="btn-3d btn-3d-accent w-full text-lg py-4">
        <GraduationCap className="size-5" /> Practice Mode
      </button>
    </div>
  );
};
