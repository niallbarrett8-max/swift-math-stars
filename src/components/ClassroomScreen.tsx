import { useState } from "react";
import { ArrowLeft, Check, Pencil, Users, X } from "lucide-react";
import {
  ClassroomStudent,
  getClassroomStudents,
  setClassroomStudentName,
} from "@/lib/profiles";

interface ClassroomScreenProps {
  onBack: () => void;
  onPickStudent: (studentId: string) => void;
}

export const ClassroomScreen = ({ onBack, onPickStudent }: ClassroomScreenProps) => {
  const [students, setStudents] = useState<ClassroomStudent[]>(() => getClassroomStudents());
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = (s: ClassroomStudent) => {
    setDraft(s.name);
    setEditing(s.id);
  };
  const commit = () => {
    if (editing) {
      setClassroomStudentName(editing, draft);
      setStudents(getClassroomStudents());
    }
    setEditing(null);
  };

  return (
    <div className="w-full max-w-3xl gradient-card rounded-3xl shadow-card p-6 sm:p-8 animate-soft-fade">
      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack} className="btn-3d btn-3d-neutral px-4 py-2 text-sm">
          <ArrowLeft className="size-4" /> Back
        </button>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full gradient-secondary text-white font-extrabold text-xs shadow-soft">
          <Users className="size-4" /> Classroom
        </div>
      </div>

      <h1 className="text-3xl sm:text-5xl font-extrabold text-gradient text-center mb-2">
        Classroom Roster
      </h1>
      <p className="text-center text-muted-foreground font-semibold mb-6">
        Tap a name to play · Tap the pencil to rename
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {students.map((s) => {
          const isEditing = editing === s.id;
          if (isEditing) {
            return (
              <div
                key={s.id}
                className="rounded-2xl bg-background border-4 border-primary p-1.5 flex items-center gap-1"
              >
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commit();
                    if (e.key === "Escape") setEditing(null);
                  }}
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold focus:outline-none px-1"
                  maxLength={24}
                />
                <button
                  onClick={commit}
                  className="size-7 rounded-lg bg-success text-success-foreground inline-flex items-center justify-center"
                  aria-label="Save"
                >
                  <Check className="size-4" strokeWidth={3} />
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="size-7 rounded-lg bg-muted inline-flex items-center justify-center"
                  aria-label="Cancel"
                >
                  <X className="size-4" strokeWidth={3} />
                </button>
              </div>
            );
          }
          return (
            <div key={s.id} className="relative">
              <button
                onClick={() => onPickStudent(s.id)}
                className="btn-3d btn-3d-neutral w-full py-3 text-sm sm:text-base truncate"
              >
                <span className="truncate max-w-full">{s.name}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit(s);
                }}
                className="absolute -top-1.5 -right-1.5 size-6 rounded-full bg-background border-2 border-border shadow-soft inline-flex items-center justify-center hover:border-primary"
                aria-label={`Rename ${s.name}`}
              >
                <Pencil className="size-3" strokeWidth={3} />
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground font-semibold">
        All progress is stored locally on this device. No accounts, no sign-in.
      </p>
    </div>
  );
};
