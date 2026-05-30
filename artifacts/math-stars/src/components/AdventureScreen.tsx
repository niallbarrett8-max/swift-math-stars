import { useState } from "react";
import { ArrowLeft, Sparkles, Star, Calendar as CalIcon, Trophy, Lock } from "lucide-react";
import {
  ADVENTURE_DURATION,
  AdventureDifficulty,
  STAR_COLORS,
  STAR_GOALS,
  STAR_ORDER,
  StarTier,
  hsAccKey,
  hsScoreKey,
  starTimeKey,
  tierUnlockedKey,
  todayKey,
} from "@/lib/game";
import { pkey } from "@/lib/profiles";

interface AdventureScreenProps {
  profileId: string;
  difficulty: AdventureDifficulty;
  onDifficultyChange: (d: AdventureDifficulty) => void;
  onBack: () => void;
  onStartStar: (diff: AdventureDifficulty, tier: StarTier) => void;
  onStartHighScore: (diff: AdventureDifficulty) => void;
  onOpenCalendar: () => void;
}

const readNum = (key: string): number | null => {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const isTierUnlocked = (profileId: string, tier: StarTier): boolean => {
  if (tier === "bronze") return true;
  if (typeof window === "undefined") return false;
  if (tier === "silver")
    return window.localStorage.getItem(pkey(profileId, tierUnlockedKey("bronze"))) === "1";
  return window.localStorage.getItem(pkey(profileId, tierUnlockedKey("silver"))) === "1";
};

const TIER_FILTER: Record<StarTier, string> = {
  bronze:
    "drop-shadow(0 0 5px hsl(22 100% 72%)) drop-shadow(0 3px 8px hsl(22 90% 40% / 0.65))",
  silver:
    "drop-shadow(0 1px 2px hsl(0 0% 100% / 0.95)) drop-shadow(0 2px 7px hsl(210 30% 65% / 0.65)) drop-shadow(0 0 12px hsl(210 40% 82% / 0.5))",
  gold:
    "drop-shadow(0 0 8px hsl(45 100% 78%)) drop-shadow(0 3px 10px hsl(38 100% 50% / 0.7))",
};

const TierStar = ({ tier, earned, size = 24 }: { tier: StarTier; earned: boolean; size?: number }) => {
  const c = STAR_COLORS[tier];
  return (
    <Star
      style={
        earned
          ? { color: c.stroke, fill: c.fill, filter: TIER_FILTER[tier] }
          : { color: "hsl(var(--muted-foreground) / 0.35)" }
      }
      width={size}
      height={size}
      strokeWidth={1.5}
    />
  );
};

const fmtTime = (s: number) => `${s.toFixed(1)}s`;

const DIFFICULTIES: { id: AdventureDifficulty; label: string; cls: string; sub: string }[] = [
  { id: "easy", label: "Easy", cls: "btn-3d-success", sub: "1–5" },
  { id: "medium", label: "Medium", cls: "btn-3d-secondary", sub: "1–20 · ×1–10" },
  { id: "hard", label: "Hard", cls: "", sub: "1–50 · ×1–12" },
];

export const AdventureScreen = ({
  profileId,
  difficulty,
  onDifficultyChange,
  onBack,
  onStartStar,
  onStartHighScore,
  onOpenCalendar,
}: AdventureScreenProps) => {
  const today = todayKey();
  const [, force] = useState(0);
  // Read fresh on every render
  const todayHs = readNum(pkey(profileId, hsScoreKey(today))) ?? 0;
  const todayAcc = readNum(pkey(profileId, hsAccKey(today))) ?? 0;

  const starInfo = (tier: StarTier) => {
    const time = readNum(pkey(profileId, starTimeKey(today, tier)));
    const unlocked = isTierUnlocked(profileId, tier);
    const earnedToday = time !== null;
    return { time, unlocked, earnedToday };
  };

  return (
    <div className="w-full max-w-2xl gradient-card rounded-3xl shadow-card p-6 sm:p-8 animate-soft-fade">
      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack} className="btn-3d btn-3d-neutral px-4 py-2 text-sm">
          <ArrowLeft className="size-4" /> Back
        </button>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full gradient-accent text-accent-foreground font-extrabold text-xs shadow-soft">
          <Sparkles className="size-4" /> Daily Math Challenge
        </div>
      </div>

      <h1 className="text-3xl sm:text-5xl font-extrabold text-gradient mb-1 text-center">
        Today's Challenge
      </h1>
      <p className="text-center text-muted-foreground font-semibold mb-5">
        Mixed questions · {ADVENTURE_DURATION}s timer
      </p>

      <section className="mb-5">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground mb-2">
          Difficulty
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTIES.map((d) => {
            const active = difficulty === d.id;
            return (
              <button
                key={d.id}
                onClick={() => {
                  onDifficultyChange(d.id);
                  force((n) => n + 1);
                }}
                className={`btn-3d ${d.cls} py-3 flex-col ${
                  active ? "btn-3d-active-ring" : "opacity-75"
                }`}
              >
                <span className="font-extrabold">{d.label}</span>
                <span className="text-[10px] opacity-90">{d.sub}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-extrabold mb-3 inline-flex items-center gap-2">
          <Star className="size-5" style={{ color: STAR_COLORS.gold.fill, fill: STAR_COLORS.gold.fill }} />
          Star Challenge
        </h2>
        <div className="space-y-2.5">
          {STAR_ORDER.map((tier) => {
            const c = STAR_COLORS[tier];
            const info = starInfo(tier);
            const goal = STAR_GOALS[tier];
            return (
              <button
                key={tier}
                onClick={() => info.unlocked && onStartStar(difficulty, tier)}
                disabled={!info.unlocked}
                className={`btn-3d ${
                  info.unlocked ? "btn-3d-neutral" : ""
                } w-full !justify-between p-4 text-left ${!info.unlocked ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <TierStar tier={tier} earned={info.earnedToday} size={32} />
                  <div className="flex flex-col items-start">
                    <span className="text-lg font-extrabold" style={{ color: c.fill }}>
                      {c.label}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      Answer {goal} correctly · 60s
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {info.unlocked ? (
                    info.time !== null ? (
                      <div className="text-sm font-extrabold" style={{ color: c.fill }}>
                        Best: {fmtTime(info.time)}
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-muted-foreground">Tap to play</div>
                    )
                  ) : (
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
                      <Lock className="size-3" /> Earn {STAR_COLORS[tier === "silver" ? "bronze" : "silver"].label} first
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-4">
        <h2 className="text-lg font-extrabold mb-3 inline-flex items-center gap-2">
          <Trophy className="size-5 text-accent" /> High Score Challenge
        </h2>
        <button
          onClick={() => onStartHighScore(difficulty)}
          className="btn-3d btn-3d-accent w-full !justify-between p-4 text-left"
        >
          <div className="flex flex-col items-start">
            <span className="text-lg font-extrabold">Full 60-second run</span>
            <span className="text-xs font-bold opacity-90">Score as many as you can</span>
          </div>
          <div className="text-right">
            {todayHs > 0 ? (
              <>
                <div className="text-sm font-extrabold">🏆 {todayHs}</div>
                <div className="text-[11px] font-bold opacity-90">🎯 {todayAcc}%</div>
              </>
            ) : (
              <div className="text-xs font-bold opacity-90">Tap to play</div>
            )}
          </div>
        </button>
      </section>

      <button
        onClick={onOpenCalendar}
        className="btn-3d btn-3d-secondary w-full text-base py-3"
      >
        <CalIcon className="size-5" /> Open Calendar
      </button>
    </div>
  );
};
