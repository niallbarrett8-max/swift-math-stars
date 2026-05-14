import { Sparkles, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Difficulty, TimerOption } from "@/lib/game";

interface SetupScreenProps {
  difficulty: Difficulty;
  timer: TimerOption;
  soundOn: boolean;
  highScore: number;
  onDifficulty: (d: Difficulty) => void;
  onTimer: (t: TimerOption) => void;
  onToggleSound: () => void;
  onStart: () => void;
}

const difficulties: { id: Difficulty; label: string; sub: string; gradient: string }[] = [
  { id: "easy", label: "Easy", sub: "1 – 5", gradient: "gradient-success" },
  { id: "medium", label: "Medium", sub: "1 – 10", gradient: "gradient-secondary" },
  { id: "hard", label: "Hard", sub: "1 – 12", gradient: "gradient-primary" },
];

const timers: { id: TimerOption; label: string }[] = [
  { id: 30, label: "30s" },
  { id: 60, label: "60s" },
  { id: 120, label: "120s" },
];

export const SetupScreen = ({
  difficulty,
  timer,
  soundOn,
  highScore,
  onDifficulty,
  onTimer,
  onToggleSound,
  onStart,
}: SetupScreenProps) => {
  return (
    <div className="w-full max-w-2xl gradient-card rounded-3xl shadow-card p-6 sm:p-10 animate-[fade-in_0.4s_ease-out]">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full gradient-accent text-accent-foreground font-bold text-sm mb-4 shadow-soft">
          <Sparkles className="size-4" /> Math Adventure
        </div>
        <h1 className="text-5xl sm:text-7xl font-extrabold text-gradient mb-3 leading-tight">
          Math Stars
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground font-semibold max-w-md mx-auto">
          Practice your multiplication and beat your high score!
        </p>
        {highScore > 0 && (
          <p className="mt-3 text-sm font-bold text-accent-foreground/80">
            🏆 Personal Best: <span className="text-foreground">{highScore}</span>
          </p>
        )}
      </div>

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
                className={`rounded-2xl p-3 sm:p-4 text-center font-extrabold transition-all border-4 ${
                  active
                    ? `${d.gradient} text-white border-transparent shadow-glow scale-[1.03]`
                    : "bg-background border-border text-foreground hover:scale-[1.02] hover:border-primary/40"
                }`}
              >
                <div className="text-base sm:text-xl">{d.label}</div>
                <div className={`text-xs sm:text-sm ${active ? "opacity-90" : "text-muted-foreground"}`}>
                  {d.sub}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-extrabold mb-3">Choose your timer</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {timers.map((t) => {
            const active = timer === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onTimer(t.id)}
                aria-pressed={active}
                className={`rounded-2xl py-4 text-center text-lg sm:text-xl font-extrabold transition-all border-4 ${
                  active
                    ? "gradient-accent text-accent-foreground border-transparent shadow-glow scale-[1.03]"
                    : "bg-background border-border text-foreground hover:scale-[1.02] hover:border-accent/40"
                }`}
              >
                {t.label}
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

      <Button
        onClick={onStart}
        className="w-full h-auto text-2xl font-extrabold rounded-2xl py-5 gradient-primary text-primary-foreground shadow-glow hover:shadow-card hover:scale-[1.02] active:scale-95 transition-all border-0"
      >
        Start Game →
      </Button>
    </div>
  );
};
