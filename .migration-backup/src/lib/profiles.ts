export interface Profile {
  id: string;
  name: string;
}

export const PROFILE_IDS = [
  "player1",
  "player2",
  "player3",
  "player4",
  "player5",
  "classroom",
] as const;
export type ProfileId = (typeof PROFILE_IDS)[number];

export const DEFAULT_PROFILE_NAMES: Record<string, string> = {
  player1: "Player 1",
  player2: "Player 2",
  player3: "Player 3",
  player4: "Player 4",
  player5: "Player 5",
  classroom: "Classroom",
};

// Legacy export — used by other modules; keep a thin list of base profiles.
export const PROFILES: Profile[] = PROFILE_IDS.map((id) => ({
  id,
  name: DEFAULT_PROFILE_NAMES[id],
}));

export const ACTIVE_PROFILE_KEY = "mathstars.activeProfile";
const NAME_KEY = (id: string) => `profile.${id}.name`;

/** Namespace a storage key under a profile. */
export const pkey = (profileId: string, key: string) => `profile.${profileId}.${key}`;

export const isClassroomStudentId = (id: string) => id.startsWith("classroom.s");

export const getActiveProfileId = (): string => {
  if (typeof window === "undefined") return "player1";
  const v = window.localStorage.getItem(ACTIVE_PROFILE_KEY);
  if (!v) return "player1";
  if ((PROFILE_IDS as readonly string[]).includes(v) && v !== "classroom") return v;
  if (isClassroomStudentId(v)) return v;
  return "player1";
};

export const setActiveProfileId = (id: string) => {
  if (typeof window !== "undefined") window.localStorage.setItem(ACTIVE_PROFILE_KEY, id);
};

// === Names ===
export const getProfileName = (id: string): string => {
  if (typeof window === "undefined") return DEFAULT_PROFILE_NAMES[id] ?? id;
  if (isClassroomStudentId(id)) {
    const s = getClassroomStudents().find((x) => x.id === id);
    return s?.name ?? "Student";
  }
  return window.localStorage.getItem(NAME_KEY(id)) ?? DEFAULT_PROFILE_NAMES[id] ?? id;
};

export const setProfileName = (id: string, name: string) => {
  if (typeof window === "undefined") return;
  const trimmed = name.trim().slice(0, 24);
  if (isClassroomStudentId(id)) {
    setClassroomStudentName(id, trimmed || "Student");
    return;
  }
  if (!trimmed) {
    window.localStorage.removeItem(NAME_KEY(id));
  } else {
    window.localStorage.setItem(NAME_KEY(id), trimmed);
  }
};

// === Classroom roster ===
export const CLASSROOM_SIZE = 30;
const CLASSROOM_KEY = "classroom.students";

export interface ClassroomStudent {
  id: string;
  name: string;
}

const defaultClassroom = (): ClassroomStudent[] =>
  Array.from({ length: CLASSROOM_SIZE }, (_, i) => ({
    id: `classroom.s${i + 1}`,
    name: `Student ${i + 1}`,
  }));

export const getClassroomStudents = (): ClassroomStudent[] => {
  if (typeof window === "undefined") return defaultClassroom();
  try {
    const raw = window.localStorage.getItem(CLASSROOM_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ClassroomStudent[];
      if (Array.isArray(parsed) && parsed.length === CLASSROOM_SIZE) return parsed;
    }
  } catch {
    /* ignore */
  }
  return defaultClassroom();
};

const writeClassroom = (list: ClassroomStudent[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLASSROOM_KEY, JSON.stringify(list));
};

export const setClassroomStudentName = (id: string, name: string) => {
  const list = getClassroomStudents();
  const idx = list.findIndex((s) => s.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], name: name.trim().slice(0, 24) || `Student ${idx + 1}` };
  writeClassroom(list);
};
