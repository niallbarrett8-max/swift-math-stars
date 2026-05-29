import { Settings as SettingsIcon, Music, Volume2, Hash, Vibrate } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { haptic, updateAudioSettings, useAudioSettings } from "@/lib/audio";

const Row = ({
  icon,
  label,
  hint,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
    <div className="flex items-start gap-3 min-w-0">
      <div className="size-9 rounded-xl bg-muted flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-bold text-sm">{label}</div>
        {hint && (
          <div className="text-xs text-muted-foreground leading-tight">{hint}</div>
        )}
      </div>
    </div>
    <div className="shrink-0 flex items-center">{children}</div>
  </div>
);

export const SettingsPanel = () => {
  const s = useAudioSettings();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          aria-label="Settings"
          onClick={() => haptic("button")}
          className="size-9 rounded-full inline-flex items-center justify-center text-muted-foreground hover:text-primary hover:scale-110 active:scale-95 transition-all"
        >
          <SettingsIcon className="size-5" strokeWidth={2.5} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm rounded-3xl p-5 sm:p-6 backdrop-blur">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-gradient">
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <Row
            icon={<Music className="size-5" />}
            label="Music"
            hint="Soft background music in menus"
          >
            <Switch
              checked={s.musicOn}
              onCheckedChange={(v) => {
                haptic("button");
                updateAudioSettings({ musicOn: v });
              }}
            />
          </Row>

          {s.musicOn && (
            <div className="px-1 pt-1 pb-3 border-b border-border">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-2">
                <span>Music volume</span>
                <span>{Math.round(s.musicVolume * 100)}%</span>
              </div>
              <Slider
                value={[Math.round(s.musicVolume * 100)]}
                min={0}
                max={100}
                step={1}
                onValueChange={(vals) =>
                  updateAudioSettings({ musicVolume: (vals[0] ?? 0) / 100 })
                }
              />
            </div>
          )}

          <Row
            icon={<Volume2 className="size-5" />}
            label="Sound Effects"
            hint="Correct, wrong, menu & rewards"
          >
            <Switch
              checked={s.sfxOn}
              onCheckedChange={(v) => {
                haptic("button");
                updateAudioSettings({ sfxOn: v });
              }}
            />
          </Row>

          <Row
            icon={<Hash className="size-5" />}
            label="Keypad Sounds"
            hint="Tap sound while typing"
          >
            <Switch
              checked={s.keypadOn}
              onCheckedChange={(v) => {
                haptic("button");
                updateAudioSettings({ keypadOn: v });
              }}
            />
          </Row>

          <Row
            icon={<Vibrate className="size-5" />}
            label="Haptics"
            hint="Subtle vibration feedback"
          >
            <Switch
              checked={s.hapticsOn}
              onCheckedChange={(v) => {
                updateAudioSettings({ hapticsOn: v });
                if (v) haptic("button");
              }}
            />
          </Row>
        </div>
      </DialogContent>
    </Dialog>
  );
};
