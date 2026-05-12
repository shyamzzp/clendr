import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { seedSnapshot } from "./calendar.js";
import { loadSnapshot, resetSnapshot, saveSnapshot } from "./storage.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  clear() {
    this.values.clear();
  }

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  removeItem(key) {
    this.values.delete(key);
  }

  setItem(key, value) {
    this.values.set(key, value);
  }
}

describe("local snapshot storage", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: new MemoryStorage(),
      configurable: true
    });
    localStorage.clear();
  });

  it("loads seed data when storage is empty", () => {
    const snapshot = loadSnapshot("2026-05-12T09:00:00.000Z");

    assert.ok(snapshot.events.length > 0);
    assert.ok(localStorage.getItem("clendr.snapshot.v1").includes("\"version\":1"));
  });

  it("saves and reloads a snapshot", () => {
    const snapshot = seedSnapshot("2026-05-12T09:00:00.000Z");
    const updated = { ...snapshot, view: "month" };

    saveSnapshot(updated);

    assert.equal(loadSnapshot("2026-05-12T09:00:00.000Z").view, "month");
  });

  it("resets back to a fresh seeded snapshot", () => {
    const snapshot = seedSnapshot("2026-05-12T09:00:00.000Z");
    saveSnapshot({ ...snapshot, events: [] });

    const reset = resetSnapshot("2026-05-12T09:00:00.000Z");

    assert.ok(reset.events.length > 0);
    assert.ok(loadSnapshot("2026-05-12T09:00:00.000Z").events.length > 0);
  });
});
