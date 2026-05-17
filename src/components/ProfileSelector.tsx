import { User } from "lucide-react";
import { PROFILES } from "@/lib/profiles";

interface ProfileSelectorProps {
  activeId: string;
  onChange: (id: string) => void;
}

export const ProfileSelector = ({ activeId, onChange }: ProfileSelectorProps) => {
  return (
    <div className="w-full mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          Playing as
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PROFILES.map((p) => {
          const active = p.id === activeId;
          return (
            <button
              key={p.id}
              onClick={() => onChange(p.id)}
              aria-pressed={active}
              className={`btn-3d ${active ? "" : "btn-3d-neutral opacity-80"} ${
                active ? "btn-3d-active-ring" : ""
              } flex-col py-2.5 text-sm`}
            >
              <User className="size-4" strokeWidth={3} />
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
