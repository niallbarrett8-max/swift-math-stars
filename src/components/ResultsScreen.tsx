import { Button } from "@/components/ui/button";
import { ConfettiCelebration } from "./ConfettiCelebration";
import { Trophy, RotateCcw, Home, Sparkles } from "lucide-react";

interface ResultsScreenProps {
  score: number;
  total: number;
  accuracy: number;
  highScore: number;
  isNewHighScore: boolean;
  onPlayAgain: () => void;
  onHome: () => void;
}

export const ResultsScreen = ({
  score,
  total,
  accuracy,
  highScore,
  isNewHighScore,
  onPlayAgain,
  onHome,
}: ResultsScreenProps) => {
  return (
    <>
      {isNewHighScore && <ConfettiCelebration />}
      <div className="w-full max-w-xl gradient-card rounded-3xl shadow-card p-6 sm:p-10 text-center animate-[scale-in_0.3s_ease-out]">
        {isNewHighScore ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full gradient-accent text-accent-foreground font-extrabold text-sm mb-4 shadow-glow animate-pulse">
            <Sparkles className="size-4" /> NEW PERSONAL BEST!
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full gradient-secondary text-white font-extrabold text-sm mb-4 shadow-soft">
            Time's Up!
          </div>
        )}

        <div className="mb-6">
          <Trophy
            className={`size-20 sm:size-24 mx-auto mb-2 ${
              isNewHighScore ? "text-accent" : "text-primary"
            }`}
            strokeWidth={2}
          />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-1">
            {isNewHighScore ? "Amazing job!" : "Great effort!"}
          </h2>
          <p className="text-muted-foreground font-semibold">Here's how you did:</p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          <div className="rounded-2xl gradient-primary text-primary-foreground p-4 shadow-soft">
            <div className="text-3xl sm:text-4xl font-extrabold">{score}</div>
            <div className="text-xs sm:text-sm font-bold opacity-90 mt-1">SCORE</div>
          </div>
          <div className="rounded-2xl gradient-secondary text-white p-4 shadow-soft">
            <div className="text-3xl sm:text-4xl font-extrabold">{total}</div>
            <div className="text-xs sm:text-sm font-bold opacity-90 mt-1">ANSWERED</div>
          </div>
          <div className="rounded-2xl gradient-success text-white p-4 shadow-soft">
            <div className="text-3xl sm:text-4xl font-extrabold">{accuracy}%</div>
            <div className="text-xs sm:text-sm font-bold opacity-90 mt-1">ACCURACY</div>
          </div>
        </div>

        <div className="rounded-2xl bg-background border-4 border-border p-4 mb-6 flex items-center justify-center gap-2 font-bold">
          <Trophy className="size-5 text-accent" />
          Personal Best: <span className="text-foreground font-extrabold text-lg">{highScore}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onPlayAgain}
            className="flex-1 h-auto text-lg font-extrabold rounded-2xl py-4 gradient-primary text-primary-foreground shadow-glow hover:scale-[1.02] active:scale-95 transition-all border-0"
          >
            <RotateCcw className="size-5 mr-2" /> Play Again
          </Button>
          <Button
            onClick={onHome}
            variant="outline"
            className="flex-1 h-auto text-lg font-extrabold rounded-2xl py-4 border-4 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Home className="size-5 mr-2" /> Change Settings
          </Button>
        </div>
      </div>
    </>
  );
};
