import { ConfettiCelebration } from "./ConfettiCelebration";
import { Trophy, RotateCcw, Home, Sparkles, Hash } from "lucide-react";
import { OP_LABEL, Operation } from "@/lib/game";

interface ResultsScreenProps {
  score: number;
  total: number;
  accuracy: number;
  highScore: number;
  isNewHighScore: boolean;
  practice: boolean;
  operation: Operation;
  family?: number;
  onPlayAgain: () => void;
  onChooseAnother?: () => void;
  onHome: () => void;
}

export const ResultsScreen = ({
  score,
  total,
  accuracy,
  highScore,
  isNewHighScore,
  practice,
  operation,
  family,
  onPlayAgain,
  onChooseAnother,
  onHome,
}: ResultsScreenProps) => {
  return (
    <>
      {(isNewHighScore || (practice && accuracy >= 90)) && <ConfettiCelebration />}
      <div className="w-full max-w-xl gradient-card rounded-3xl shadow-card p-6 sm:p-10 text-center animate-soft-fade">
        {practice ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full gradient-secondary text-white font-extrabold text-sm mb-4 shadow-soft">
            Practice Complete! · {OP_LABEL[operation]} {family && `· Family ${family}`}
          </div>
        ) : isNewHighScore ? (
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
            <div className="text-xs sm:text-sm font-bold opacity-90 mt-1">CORRECT</div>
          </div>
          <div className="rounded-2xl gradient-secondary text-white p-4 shadow-soft">
            <div className="text-3xl sm:text-4xl font-extrabold">{total}</div>
            <div className="text-xs sm:text-sm font-bold opacity-90 mt-1">ATTEMPTS</div>
          </div>
          <div className="rounded-2xl gradient-success text-white p-4 shadow-soft">
            <div className="text-3xl sm:text-4xl font-extrabold">{accuracy}%</div>
            <div className="text-xs sm:text-sm font-bold opacity-90 mt-1">ACCURACY</div>
          </div>
        </div>

        {!practice && (
          <div className="rounded-2xl bg-background border-4 border-border p-4 mb-6 flex items-center justify-center gap-2 font-bold">
            <Trophy className="size-5 text-accent" />
            Personal Best:{" "}
            <span className="text-foreground font-extrabold text-lg">{highScore}</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button onClick={onPlayAgain} className="btn-3d w-full text-lg py-4">
            <RotateCcw className="size-5" /> {practice ? "Practice Again" : "Play Again"}
          </button>
          {practice && onChooseAnother && (
            <button
              onClick={onChooseAnother}
              className="btn-3d btn-3d-accent w-full text-lg py-4"
            >
              <Hash className="size-5" /> Choose Another Number
            </button>
          )}
          <button onClick={onHome} className="btn-3d btn-3d-neutral w-full text-lg py-4">
            <Home className="size-5" /> Main Menu
          </button>
        </div>
      </div>
    </>
  );
};
