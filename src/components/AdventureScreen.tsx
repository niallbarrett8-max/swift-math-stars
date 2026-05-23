import { ArrowLeft, Sparkles, Star, Calendar as CalIcon } from "lucide-react";
import {
  ADVENTURE_DURATION,
  AdventureDifficulty,
  STAR_GOALS,
  adventureDayKey,
  todayKey,
} from "@/lib/game";
import { pkey } from "@/lib/profiles";

interface AdventureScreenProps {
  profileId: string;
  onBack: () => void;
  onStartChallenge: (difficulty: AdventureDifficulty) => void;
}

const readStars = (profileId: string, date: string, diff: AdventureDifficulty): number => {
  if (typeof window === "undefined") return 0;
  const v = window.localStorage.getItem(pkey(profileId, adventureDayKey(date, diff)));
  const n = v ? Number(v) : 0;
  return Number.isFinite(n) ? Math.max(0, Math.min(3, n)) : 0;
};

const DIFFICULTIES: { id: AdventureDifficulty; label: string; cls: string; sub: string }[] = [
  { id: "easy", label: "Easy", cls: "btn-3d-success", sub: "Add/Sub 1–5 · Tables 1–5" },
  { id: "medium", label: "Medium", cls: "btn-3d-secondary", sub: "Add/Sub 1–20 · Tables 1–10" },
  { id: "hard", label: "Hard", cls: "", sub: "Add/Sub 1–50 · Tables 1–12" },
];

const StarRow = ({ count, size = "size-5" }: { count: number; size?: string }) => (
  <div className="inline-flex gap-0.5">
    {[1, 2, 3].map((n) => (
      <Star
        key={n}
        className={`${size} ${
          n <= count ? "fill-accent text-accent" : "text-muted-foreground/40"
        }`}
        strokeWidth={2}
      />
    ))}
  </div>
);

// Build last 14 days for the mini calendar
const recentDays = (): string[] => {
  const out: string[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(todayKey(d));
  }
  return out;
};

export const AdventureScreen = ({ profileId, onBack, onStartChallenge }: AdventureScreenProps) => {
  const today = todayKey();
  const days = recentDays();
  const totalStars = days.reduce(
    (sum, d) =>
      sum +
      readStars(profileId, d, "easy") +
      readStars(profileId, d, "medium") +
      readStars(profileId, d, "hard"),
    0,
  );

  return (
    <div className="w-full max-w-2xl gradient-card rounded-3xl shadow-card p-6 sm:p-10 animate-soft-fade">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="btn-3d btn-3d-neutral px-4 py-2 text-sm">
          <ArrowLeft className="size-4" /> Back
        </button>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full gradient-accent text-accent-foreground font-extrabold text-xs shadow-soft">
          <Sparkles className="size-4" /> Math Adventure
        </div>
      </div>

      <h1 className="text-3xl sm:text-5xl font-extrabold text-gradient mb-2 text-center">
        Daily Challenges
      </h1>
      <p className="text-center text-muted-foreground font-semibold mb-6">
        Mixed questions · {ADVENTURE_DURATION} seconds · Earn up to ⭐⭐⭐ each day
      </p>

      <div className="space-y-3 mb-8">
        {DIFFICULTIES.map((d) => {
          const earned = readStars(profileId, today, d.id);
          return (
            <button
              key={d.id}
              onClick={() => onStartChallenge(d.id)}
              className={`btn-3d ${d.cls} w-full !justify-between p-4 sm:p-5 text-left`}
            >
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-xl sm:text-2xl font-extrabold">{d.label}</span>
                <span className="text-[11px] sm:text-xs font-bold opacity-90">{d.sub}</span>
                <span className="text-[11px] sm:text-xs font-bold opacity-90">
                  ⭐ {STAR_GOALS.bronze} · ⭐⭐ {STAR_GOALS.silver} · ⭐⭐⭐ {STAR_GOALS.gold}
                </span>
              </div>
              <StarRow count={earned} size="size-6" />
            </button>
          );
        })}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-extrabold inline-flex items-center gap-2">
            <CalIcon className="size-5 text-primary" /> Star Calendar
          </h2>
          <span className="text-sm font-extrabold text-gradient">{totalStars} ⭐ collected</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((d) => {
            const stars =
              readStars(profileId, d, "easy") +
              readStars(profileId, d, "medium") +
              readStars(profileId, d, "hard");
            const isToday = d === today;
            const day = Number(d.slice(-2));
            return (
              <div
                key={d}
                className={`rounded-xl p-2 text-center border-2 ${
                  isToday ? "border-primary bg-primary/10" : "border-border bg-background"
                }`}
                title={d}
              >
                <div className="text-[10px] font-bold text-muted-foreground">{day}</div>
                <div className="mt-1 flex items-center justify-center h-5">
                  {stars > 0 ? (
                    <span className="text-xs font-extrabold inline-flex items-center gap-0.5">
                      <Star className="size-3 fill-accent text-accent" />
                      {stars}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40">·</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground font-semibold">
          Try as many times as you want — your best stars are saved for the day.
        </p>
      </section>
    </div>
  );
};
