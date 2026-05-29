import { useRef, useState } from "react";
import { User, Users } from "lucide-react";
import {
  getProfileName,
  setProfileName,
} from "@/lib/profiles";
import { RenameField } from "./RenameField";

interface ProfileSelectorProps {
  activeId: string;
  onChange: (id: string) => void;
}

const LONG_PRESS_MS = 500;

const PLAYER_IDS = ["player1", "player2", "player3", "player4"] as const;

export const ProfileSelector = ({ activeId, onChange }: ProfileSelectorProps) => {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [bump, setBump] = useState(0);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeBaseId = activeId.startsWith("classroom") ? "classroom" : activeId;

  const startEdit = (id: string) => {
    setDraft(getProfileName(id));
    setEditing(id);
  };

  const commit = () => {
    if (editing) {
      setProfileName(editing, draft);
      setBump((n) => n + 1);
    }
    setEditing(null);
  };

  const cancel = () => setEditing(null);

  const startPress = (id: string) => {
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      startEdit(id);
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleClick = (id: string) => {
    if (pressTimer.current !== null) {
      cancelPress();
      onChange(id);
    }
  };

  return (
    <div className="w-full mb-4" key={bump}>
      <div className="mb-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          Playing as
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        {PLAYER_IDS.map((id) => {
          const active = activeBaseId === id;
          const name = getProfileName(id);
          const isEditing = editing === id;

          if (isEditing) {
            return (
              <RenameField
                key={id}
                value={draft}
                onChange={setDraft}
                onCommit={commit}
                onCancel={cancel}
              />
            );
          }

          return (
            <button
              key={id}
              onPointerDown={() => startPress(id)}
              onPointerUp={() => handleClick(id)}
              onPointerLeave={cancelPress}
              onContextMenu={(e) => {
                e.preventDefault();
                cancelPress();
                startEdit(id);
              }}
              aria-pressed={active}
              aria-label={`Select ${name}. Long press to rename.`}
              className={`btn-3d ${
                active ? "btn-3d-active-ring" : "btn-3d-neutral opacity-80"
              } flex-col py-4 text-sm min-h-[68px] w-full select-none`}
            >
              <User className="size-5 mb-1" strokeWidth={3} />
              <span className="truncate max-w-full px-1 font-bold">{name}</span>
            </button>
          );
        })}
      </div>

      {editing === "classroom" ? (
        <RenameField
          value={draft}
          onChange={setDraft}
          onCommit={commit}
          onCancel={cancel}
        />
      ) : (
        <button
          onClick={() => onChange("classroom")}
          aria-pressed={activeBaseId === "classroom"}
          className={`btn-3d btn-3d-secondary ${
            activeBaseId === "classroom" ? "btn-3d-active-ring" : "opacity-80"
          } w-full flex items-center justify-center gap-2 py-3 text-sm`}
        >
          <Users className="size-5" strokeWidth={3} />
          <span className="font-bold">Classroom</span>
        </button>
      )}
    </div>
  );
};
