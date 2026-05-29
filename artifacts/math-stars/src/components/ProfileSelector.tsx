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
  // Always-present hidden input — focused on pointerdown so iOS raises
  // the keyboard during the touch event, before the rename field mounts.
  const hiddenInputRef = useRef<HTMLInputElement>(null);

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
    // Focus the hidden input immediately (synchronously within the touch event)
    // so iOS sees a direct user-gesture and raises the keyboard. When the
    // RenameField mounts 500 ms later and its useEffect fires focus(), the
    // keyboard is already up and transfers smoothly to the real input.
    try { hiddenInputRef.current?.focus(); } catch (_) { /* ignore */ }

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
    // Blur the hidden input if rename didn't open (tap ended early).
    if (!editing) {
      try { hiddenInputRef.current?.blur(); } catch (_) { /* ignore */ }
    }
  };

  const handlePointerUp = (id: string) => {
    if (pressTimer.current !== null) {
      // Short tap — cancel long press and select profile.
      cancelPress();
      onChange(id);
    }
    // If pressTimer is null, long press already fired → do nothing here.
  };

  return (
    <div className="w-full mb-4" key={bump}>
      {/* Hidden input — keeps the iOS keyboard open across the 500 ms gap */}
      <input
        ref={hiddenInputRef}
        type="text"
        aria-hidden="true"
        tabIndex={-1}
        readOnly
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          width: 1,
          height: 1,
          fontSize: 16,
        }}
      />

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
              onPointerUp={() => handlePointerUp(id)}
              onPointerLeave={cancelPress}
              onPointerCancel={cancelPress}
              onContextMenu={(e) => {
                e.preventDefault();
                cancelPress();
                startEdit(id);
              }}
              aria-pressed={active}
              aria-label={`Select ${name}. Long press to rename.`}
              className={`btn-3d ${
                active ? "btn-3d-active-ring" : "btn-3d-neutral opacity-80"
              } flex-col py-4 text-sm min-h-[68px] w-full select-none touch-none`}
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
