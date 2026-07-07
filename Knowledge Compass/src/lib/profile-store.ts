import { useEffect, useState } from "react";

import { currentUserId, employees, type Employee } from "./mock/employees";

const STORAGE_KEY = "switchboard.profile.v1";

type ProfileOverrides = {
  expertise?: Employee["expertise"];
  gaps?: string[];
  preferences?: Employee["preferences"];
};

function readOverrides(): ProfileOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ProfileOverrides;
  } catch {
    return {};
  }
}

function writeOverrides(next: ProfileOverrides) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function useMyProfile() {
  const base = employees.find((e) => e.id === currentUserId)!;
  const [overrides, setOverrides] = useState<ProfileOverrides>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOverrides(readOverrides());
    setHydrated(true);
  }, []);

  const profile: Employee = {
    ...base,
    expertise: overrides.expertise ?? base.expertise,
    gaps: overrides.gaps ?? base.gaps,
    preferences: overrides.preferences ?? base.preferences,
  };

  const update = (patch: ProfileOverrides) => {
    setOverrides((prev) => {
      const next = { ...prev, ...patch };
      writeOverrides(next);
      return next;
    });
  };

  const reset = () => {
    writeOverrides({});
    setOverrides({});
  };

  return { profile, update, reset, hydrated };
}
