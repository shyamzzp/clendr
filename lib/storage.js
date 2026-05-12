import { seedSnapshot } from "./calendar.js";

export const STORAGE_KEY = "clendr.snapshot.v1";

export function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function storage() {
  if (typeof localStorage !== "undefined") {
    return localStorage;
  }
  return null;
}

export function saveSnapshot(snapshot) {
  const store = storage();
  if (!store) return snapshot;
  store.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  return snapshot;
}

export function loadSnapshot(nowValue = new Date().toISOString()) {
  const store = storage();
  if (!store) {
    return seedSnapshot(nowValue);
  }

  const raw = store.getItem(STORAGE_KEY);
  if (!raw) {
    return saveSnapshot(seedSnapshot(nowValue));
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version === 1 && Array.isArray(parsed.events) && Array.isArray(parsed.calendars)) {
      return parsed;
    }
  } catch {
    // Fall through to a clean seed when local data is corrupted.
  }

  return saveSnapshot(seedSnapshot(nowValue));
}

export function resetSnapshot(nowValue = new Date().toISOString()) {
  return saveSnapshot(seedSnapshot(nowValue));
}

export function exportSnapshot(snapshot) {
  return JSON.stringify(snapshot, null, 2);
}

export function importSnapshot(raw) {
  const parsed = JSON.parse(raw);
  if (parsed?.version !== 1 || !Array.isArray(parsed.events) || !Array.isArray(parsed.calendars)) {
    throw new Error("Invalid Clendr backup file");
  }
  return saveSnapshot(parsed);
}

