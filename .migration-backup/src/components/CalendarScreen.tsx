import { ArrowLeft, Trophy, Calendar as CalIcon } from "lucide-react";
import {
  STAR_COLORS,
  STAR_ORDER,
  StarTier,
  hsAccKey,
  hsScoreKey,
  starTimeKey,
  todayKey,
} from "@/lib/game";
import { Star } from "lucide-react";
import { getProfileName, pkey } from "@/lib/profiles";

interface CalendarScreenProps {
  profileId: string;
  onBack: () => void;
}

const readNum = (key: string): number | null => {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const recentDays = (count = 14): string[] => {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(todayKey(d));
  }
  return out;
};

const formatDay = (key: string) => {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

const fmtTime = (s: number) => `${s.toFixed(1)}s`;

const TierStar = ({ tier, earned }: { tier: StarTier; earned: boolean }) => {
  const c = STAR_COLORS[tier];
  return (
    <Star
      width={18}
      height={18}
      strokeWidth={2}
      style={
        earned
          ? { color: c.fill, fill: c.fill }
          : { color: "hsl(var(--muted-foreground) / 0.3)" }
      }
    />
  );
};

export const CalendarScreen = ({ profileId, onBack }: CalendarScreenProps) => {
  const days = recentDays(14);
  const playerName = getProfileName(profileId);

  return (
    <div className="w-full max-w-2xl gradient-card rounded-3xl shadow-card p-6 sm:p-8 animate-soft-fade">
      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack} className="btn-3d btn-3d-neutral px-4 py-2 text-sm">
          <ArrowLeft className="size-4" /> Back
        </button>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full gradient-secondary text-white font-extrabold text-xs shadow-soft">
          <CalIcon className="size-4" /> Calendar
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-gradient mb-1 text-center">
        {playerName}'s Progress
      </h1>
      <p className="text-center text-muted-foreground font-semibold mb-5">
        Last 14 days of challenges
      </p>

      <div className="space-y-2.5">
        {days.map((d) => {
          const stars = STAR_ORDER.map((t) => ({
            tier: t,
            time: readNum(pkey(profileId, starTimeKey(d, t))),
          }));
          const hs = readNum(pkey(profileId, hsScoreKey(d)));
          const acc = readNum(pkey(profileId, hsAccKey(d)));
          const anything = stars.some((s) => s.time !== null) || hs !== null;
          const isToday = d === todayKey();

          return (
            <div
              key={d}
              className={`rounded-2xl bg-background border-4 ${
                isToday ? "border-primary" : "border-border"
              } p-3 sm:p-4`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-sm sm:text-base">
                  {formatDay(d)} {isToday && <span className="text-primary">· Today</span>}
                </span>
                {!anything && (
                  <span className="text-xs text-muted-foreground font-bold">No play yet</span>
                )}
              </div>
              {anything && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm font-bold">
                    {stars.map((s) => (
                      <span
                        key={s.tier}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 bg-muted"
                      >
                        <TierStar tier={s.tier} earned={s.time !== null} />
                        {s.time !== null ? (
                          <span style={{ color: STAR_COLORS[s.tier].fill }}>{fmtTime(s.time)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2 text-xs sm:text-sm font-bold">
                    {hs !== null ? (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 bg-accent/20">
                          <Trophy className="size-3.5 text-accent" /> {hs}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 bg-secondary/20">
                          🎯 {acc ?? 0}%
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">No high-score run</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
