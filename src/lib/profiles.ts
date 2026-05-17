export interface Profile {
  id: string;
  name: string;
}

export const PROFILES: Profile[] = [
  { id: "child1", name: "Child 1" },
  { id: "child2", name: "Child 2" },
  { id: "child3", name: "Child 3" },
];

export const ACTIVE_PROFILE_KEY = "mathstars.activeProfile";

export const getActiveProfileId = (): string => {
  if (typeof window === "undefined") return PROFILES[0].id;
  const v = window.localStorage.getItem(ACTIVE_PROFILE_KEY);
  return PROFILES.find((p) => p.id === v)?.id ?? PROFILES[0].id;
};

export const setActiveProfileId = (id: string) => {
  if (typeof window !== "undefined") window.localStorage.setItem(ACTIVE_PROFILE_KEY, id);
};

/** Namespace a storage key under a profile. */
export const pkey = (profileId: string, key: string) => `profile.${profileId}.${key}`;
