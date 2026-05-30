import { ConfettiCelebration } from "./ConfettiCelebration";
import { Trophy, RotateCcw, Home, Sparkles, Hash, Play, Star, Clock, ChevronRight } from "lucide-react";
import { playClick } from "@/lib/audio";
import {
  AdventureDifficulty,
  OP_LABEL,
  Operation,
  STAR_COLORS,
  StarTier,
  TargetScore,
} from "@/lib/game";

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
  starTier?: StarTier;
  starEarned?: boolean;
  highScoreChallenge?: boolean;
  elapsedSeconds?: number;
  onPlayAgain: () => void;
  onNextTier?: () => void;
  onContinue?: () => void;
  onChooseAnother?: () => void;
  onHome: () => void;
}

const STAR_CHEER: Record<StarTier, string> = {
  bronze: "Well Done!",
  silver: "Awesome!",
  gold: "Incredible!",
};

const NEXT_TIER_LABEL: Record<StarTier, string> = {
  bronze: "Play Silver Challenge",
  silver: "Play Gold Challenge",
  gold: "Play 60-Second Run",
};

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
  starTier,
  starEarned,
  highScoreChallenge,
  elapsedSeconds,
  onPlayAgain,
  onNextTier,
  onContinue,
  onChooseAnother,
  onHome,
}: ResultsScreenProps) => {
  const tierColor = starTier ? STAR_COLORS[starTier].fill : undefined;
  const celebrate =
    isNewHighScore ||
    targetReached ||
    (practice && accuracy >= 90) ||
    !!starEarned ||
    (highScoreChallenge && isNewHighScore);

  return (
    <>
      {celebrate && <ConfettiCelebration />}
      <div className="w-full max-w-xl gradient-card rounded-3xl shadow-card p-6 sm:p-10 text-center animate-soft-fade">
        {starTier ? (
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-white font-extrabold text-sm mb-4 shadow-glow"
            style={{ background: tierColor }}
          >
            <Star className="size-4 fill-current" />
            {starEarned ? `${STAR_COLORS[starTier].label} Star Earned!` : `${STAR_COLORS[starTier].label} Challenge`}
          </div>
        ) : highScoreChallenge ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full gradient-accent text-white font-extrabold text-sm mb-4 shadow-glow">
            <Trophy className="size-4" /> High Score Run Complete
          </div>
        ) : challenge ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full gradient-accent text-white font-extrabold text-sm mb-4 shadow-glow">
            <Sparkles className="size-4" /> Challenge Complete!
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full gradient-accent text-white font-extrabold text-sm mb-4 shadow-glow animate-pulse">
            <Sparkles className="size-4" /> NEW PERSONAL BEST!
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full gradient-secondary text-white font-extrabold text-sm mb-4 shadow-soft">
            Time's Up!
          </div>
        )}

        <div className="mb-6">
          {starTier ? (
            <div className="flex items-center justify-center mb-2">
              <Star
                className="size-24"
                strokeWidth={1.5}
                style={{
                  color: starEarned ? STAR_COLORS[starTier].stroke : "hsl(var(--muted-foreground) / 0.4)",
                  fill: starEarned ? tierColor : "transparent",
                  filter: starEarned ? `drop-shadow(0 4px 20px ${tierColor})` : undefined,
                }}
              />
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
            {starEarned
              ? STAR_CHEER[starTier!]
              : targetReached
                ? "You did it!"
                : isNewHighScore
                  ? "Amazing job!"
                  : starTier
                    ? "So close!"
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
          <div className="rounded-2xl gradient-accent text-white p-4 shadow-soft">
            <div className="text-3xl sm:text-4xl font-extrabold">{bestStreak}</div>
            <div className="text-xs sm:text-sm font-bold opacity-90 mt-1">BEST STREAK</div>
          </div>
        </div>

        {(starEarned || highScoreChallenge) && elapsedSeconds !== undefined && (
          <div className="rounded-2xl bg-background border-4 border-border p-3 mb-4 inline-flex items-center justify-center gap-2 font-extrabold w-full">
            <Clock className="size-5 text-primary" />
            {starEarned ? "Completion Time:" : "Time:"} {elapsedSeconds.toFixed(1)}s
          </div>
        )}

        <p className="text-xs sm:text-sm text-muted-foreground font-bold mb-6">
          {total} total attempts
        </p>

        {!practice && !challenge && !highScoreChallenge && !starTier && (
          <div className="rounded-2xl bg-background border-4 border-border p-4 mb-6 flex items-center justify-center gap-2 font-bold">
            <Trophy className="size-5 text-accent" />
            Personal Best:{" "}
            <span className="text-foreground font-extrabold text-lg">{highScore}</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {targetReached && onContinue && (
            <button onClick={() => { playClick(); onContinue!(); }} className="btn-3d btn-3d-success w-full text-lg py-4">
              <Play className="size-5" /> Continue Playing
            </button>
          )}
          {starEarned && onNextTier && starTier && (
            <button onClick={() => { playClick(); onNextTier!(); }} className="btn-3d btn-3d-success w-full text-lg py-4">
              <ChevronRight className="size-5" /> {NEXT_TIER_LABEL[starTier]}
            </button>
          )}
          <button
            onClick={() => { playClick(); onPlayAgain(); }}
            className={`btn-3d ${starEarned ? "btn-3d-neutral" : ""} w-full text-lg py-4`}
          >
            <RotateCcw className="size-5" /> {practice ? "Practice Again" : "Play Again"}
          </button>
          {practice && onChooseAnother && (
            <button
              onClick={() => { playClick(); onChooseAnother!(); }}
              className="btn-3d btn-3d-accent w-full text-lg py-4"
            >
              <Hash className="size-5" /> Choose Another Number
            </button>
          )}
          <button onClick={() => { playClick(); onHome(); }} className="btn-3d btn-3d-neutral w-full text-lg py-4">
            <Home className="size-5" /> Main Menu
          </button>
        </div>
      </div>
    </>
  );
};
