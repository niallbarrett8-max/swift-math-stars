import { Clock, Target, Trophy } from "lucide-react";

interface StatsBarProps {
  score: number;
  accuracy: number;
  timeLeft: number;
  totalTime: number;
}

const Stat = ({
  icon: Icon,
  label,
  value,
  gradient,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  gradient: string;
}) => (
  <div className="flex-1 gradient-card rounded-2xl p-3 sm:p-4 shadow-soft flex items-center gap-3">
    <div className={`${gradient} rounded-xl p-2 sm:p-2.5 shadow-soft`}>
      <Icon className="size-5 sm:size-6 text-white" strokeWidth={2.5} />
    </div>
    <div className="min-w-0">
      <div className="text-xs sm:text-sm text-muted-foreground font-semibold leading-tight">{label}</div>
      <div className="text-lg sm:text-2xl font-extrabold leading-tight">{value}</div>
    </div>
  </div>
);

export const StatsBar = ({ score, accuracy, timeLeft, totalTime }: StatsBarProps) => {
  const pct = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));
  const lowTime = timeLeft <= 10;

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat icon={Trophy} label="Score" value={String(score)} gradient="gradient-accent" />
        <Stat icon={Target} label="Accuracy" value={`${accuracy}%`} gradient="gradient-secondary" />
        <Stat
          icon={Clock}
          label="Time"
          value={`${timeLeft}s`}
          gradient={lowTime ? "bg-destructive" : "gradient-primary"}
        />
      </div>
      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
            lowTime ? "bg-destructive" : "gradient-primary"
          }`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={timeLeft}
          aria-valuemin={0}
          aria-valuemax={totalTime}
          aria-label="Time remaining"
        />
      </div>
    </div>
  );
};
