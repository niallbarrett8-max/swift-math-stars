import { ConfettiCelebration } from "./ConfettiCelebration";
import { Trophy, RotateCcw, Home, Sparkles, Hash, Play, Star } from "lucide-react";
import { AdventureDifficulty, OP_LABEL, Operation, TargetScore } from "@/lib/game";

interface ResultsScreenProps {
  score: number;
  total: number;
  accuracy: number;
  bestStreak?: number;
  highScore: number;
  isNewHighScore: boolean;
  practice: boolean;
  operation: Operation;
  family?: number;
  targetReached?: boolean;
  targetScore?: TargetScore;
  challenge?: AdventureDifficulty;
  starsEarned?: 0 | 1 | 2 | 3;
  onPlayAgain: () => void;
  onContinue?: () => void;
  onChooseAnother?: () => void;
  onHome: () => void;
}

export const ResultsScreen = ({
  score,
  total,
  accuracy,
  bestStreak = 0,
  highScore,
  isNewHighScore,
  practice,
  operation,
  family,
  targetReached,
  challenge,
  starsEarned,
  onPlayAgain,
  onContinue,
  onChooseAnother,
  onHome,
}: ResultsScreenProps) => {
  const celebrate =
    isNewHighScore || targetReached || (practice && accuracy >= 90) || (starsEarned ?? 0) >= 1;

  return (
    <>
      {celebrate && <ConfettiCelebration />}
      <div className="w-full max-w-xl gradient-card rounded-3xl shadow-card p-6 sm:p-10 text-center animate-soft-fade">
        {challenge ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full gradient-accent text-accent-foreground font-extrabold text-sm mb-4 shadow-glow">
            <Sparkles className="size-4" /> Challenge Complete! · {challenge.toUpperCase()}
          </div>
        ) : targetReached ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full gradient-success text-white font-extrabold text-sm mb-4 shadow-glow">
            <Sparkles className="size-4" /> Target Complete!
          </div>
        ) : practice ? (
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
          {challenge && starsEarned !== undefined ? (
            <div className="flex items-center justify-center gap-2 mb-2">
              {[1, 2, 3].map((n) => (
                <Star
                  key={n}
                  className={`size-12 sm:size-16 ${
                    n <= starsEarned
                      ? "fill-accent text-accent drop-shadow-[0_2px_8px_hsl(var(--accent)/0.6)]"
                      : "text-muted"
                  }`}
                  strokeWidth={2}
                />
              ))}
            </div>
          ) : (
            <Trophy
              className={`size-20 sm:size-24 mx-auto mb-2 ${
                isNewHighScore || targetReached ? "text-accent" : "text-primary"
              }`}
              strokeWidth={2}
            />
          )}
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-1">
            {targetReached
              ? "You did it!"
              : (starsEarned ?? 0) >= 3
                ? "Gold stars!"
                : isNewHighScore
                  ? "Amazing job!"
                  : "Great effort!"}
          </h2>
          <p className="text-muted-foreground font-semibold">Here's how you did:</p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <div className="rounded-2xl gradient-primary text-primary-foreground p-4 shadow-soft">
            <div className="text-3xl sm:text-4xl font-extrabold">{score}</div>
            <div className="text-xs sm:text-sm font-bold opacity-90 mt-1">CORRECT</div>
          </div>
          <div className="rounded-2xl gradient-secondary text-white p-4 shadow-soft">
            <div className="text-3xl sm:text-4xl font-extrabold">{accuracy}%</div>
            <div className="text-xs sm:text-sm font-bold opacity-90 mt-1">ACCURACY</div>
          </div>
          <div className="rounded-2xl gradient-accent text-accent-foreground p-4 shadow-soft">
            <div className="text-3xl sm:text-4xl font-extrabold">{bestStreak}</div>
            <div className="text-xs sm:text-sm font-bold opacity-90 mt-1">BEST STREAK</div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground font-bold mb-6">
          {total} total attempts
        </p>

        {!practice && !challenge && (
          <div className="rounded-2xl bg-background border-4 border-border p-4 mb-6 flex items-center justify-center gap-2 font-bold">
            <Trophy className="size-5 text-accent" />
            Personal Best:{" "}
            <span className="text-foreground font-extrabold text-lg">{highScore}</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {targetReached && onContinue && (
            <button onClick={onContinue} className="btn-3d btn-3d-success w-full text-lg py-4">
              <Play className="size-5" /> Continue Playing
            </button>
          )}
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
