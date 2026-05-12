import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createEvent,
  createReminder,
  eventsForDate,
  eventsForMonth,
  seedSnapshot,
  visibleEvents
} from "./calendar.js";

describe("calendar utilities", () => {
  it("seeds a usable local calendar snapshot", () => {
    const snapshot = seedSnapshot("2026-05-12T09:00:00.000Z");

    assert.equal(snapshot.version, 1);
    assert.equal(snapshot.view, "week");
    assert.ok(snapshot.calendars.length >= 4);
    assert.ok(snapshot.events.length >= 8);
    assert.ok(snapshot.reminders.length >= 4);
  });

  it("creates valid events with the selected calendar", () => {
    const event = createEvent({
      calendarId: "work",
      title: "Design review",
      start: "2026-05-12T15:00:00.000Z",
      end: "2026-05-12T16:00:00.000Z"
    });

    assert.match(event.id, /^evt-/);
    assert.equal(event.status, "scheduled");
    assert.equal(event.calendarId, "work");
    assert.equal(event.recurrence, "none");
  });

  it("creates incomplete reminders by default", () => {
    const reminder = createReminder({
      title: "Send agenda",
      due: "2026-05-12T12:00:00.000Z",
      priority: "high"
    });

    assert.match(reminder.id, /^rem-/);
    assert.equal(reminder.completed, false);
    assert.equal(reminder.priority, "high");
  });

  it("filters events for a specific date", () => {
    const snapshot = seedSnapshot("2026-05-12T09:00:00.000Z");
    const events = eventsForDate(snapshot.events, "2026-05-12T00:00:00.000Z");

    assert.ok(events.map((event) => event.title).includes("Product planning"));
    assert.equal(events.every((event) => event.start.startsWith("2026-05-12")), true);
  });

  it("filters visible events using calendar visibility", () => {
    const snapshot = seedSnapshot("2026-05-12T09:00:00.000Z");
    const hiddenCalendarId = snapshot.calendars[0].id;
    const calendars = snapshot.calendars.map((calendar) =>
      calendar.id === hiddenCalendarId ? { ...calendar, visible: false } : calendar
    );
    const events = visibleEvents(snapshot.events, calendars);

    assert.equal(events.some((event) => event.calendarId === hiddenCalendarId), false);
  });

  it("returns events inside the requested month", () => {
    const snapshot = seedSnapshot("2026-05-12T09:00:00.000Z");
    const events = eventsForMonth(snapshot.events, "2026-05-01T00:00:00.000Z");

    assert.ok(events.length > 4);
    assert.equal(events.every((event) => event.start.startsWith("2026-05")), true);
  });
});
