import { useState } from "react";
import { Pencil, User, Users } from "lucide-react";
import {
  PROFILE_IDS,
  getProfileName,
  isClassroomStudentId,
  setProfileName,
} from "@/lib/profiles";
import { RenameField } from "./RenameField";

interface ProfileSelectorProps {
  activeId: string;
  onChange: (id: string) => void;
}

export const ProfileSelector = ({ activeId, onChange }: ProfileSelectorProps) => {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [bump, setBump] = useState(0);

  const activeBaseId = isClassroomStudentId(activeId) ? "classroom" : activeId;

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

  return (
    <div className="w-full mb-4" key={bump}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          Playing as
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PROFILE_IDS.map((id) => {
          const isClass = id === "classroom";
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
            <div key={id} className="relative">
              <button
                onClick={() => onChange(id)}
                aria-pressed={active}
                className={`btn-3d ${
                  active ? (isClass ? "btn-3d-secondary" : "") : "btn-3d-neutral opacity-80"
                } ${active ? "btn-3d-active-ring" : ""} w-full flex-col py-2.5 text-sm min-h-[56px]`}
              >
                {isClass ? (
                  <Users className="size-4" strokeWidth={3} />
                ) : (
                  <User className="size-4" strokeWidth={3} />
                )}
                <span className="truncate max-w-full px-1">{name}</span>
              </button>
              {!isClass && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(id);
                  }}
                  className="absolute -top-2 -right-2 size-7 rounded-full bg-background border-2 border-border shadow-soft inline-flex items-center justify-center hover:border-primary"
                  aria-label={`Rename ${name}`}
                >
                  <Pencil className="size-3.5" strokeWidth={3} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
