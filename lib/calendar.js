import {
  endOfDay,
  endOfMonth,
  isSameDay,
  isWithinRange,
  iso,
  startOfDay,
  startOfMonth
} from "./date-utils.js";

const palette = {
  work: "#e84d4d",
  personal: "#2f80ed",
  family: "#8f5bd6",
  focus: "#21a67a",
  holidays: "#f2a93b"
};

export function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export function createEvent(input) {
  return {
    id: input.id ?? createId("evt"),
    calendarId: input.calendarId,
    title: input.title,
    location: input.location ?? "",
    notes: input.notes ?? "",
    start: input.start,
    end: input.end,
    allDay: input.allDay ?? false,
    status: input.status ?? "scheduled",
    attendees: input.attendees ?? [],
    recurrence: input.recurrence ?? "none"
  };
}

export function createReminder(input) {
  return {
    id: input.id ?? createId("rem"),
    title: input.title,
    due: input.due,
    priority: input.priority ?? "medium",
    completed: input.completed ?? false,
    eventId: input.eventId
  };
}

function at(base, dayOffset, hour, minute = 0) {
  const date = new Date(base);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return iso(date);
}

export function seedSnapshot(nowValue = new Date().toISOString()) {
  const now = new Date(nowValue);
  const selectedDate = iso(startOfDay(now));

  const calendars = [
    { id: "work", name: "Work", color: palette.work, visible: true, accent: "red" },
    { id: "personal", name: "Personal", color: palette.personal, visible: true, accent: "blue" },
    { id: "family", name: "Family", color: palette.family, visible: true, accent: "purple" },
    { id: "focus", name: "Focus", color: palette.focus, visible: true, accent: "green" },
    { id: "holidays", name: "Holidays", color: palette.holidays, visible: true, accent: "gold" }
  ];

  const events = [
    createEvent({ id: "evt-planning", calendarId: "work", title: "Product planning", location: "Studio room", start: at(now, 0, 9), end: at(now, 0, 10, 15), attendees: ["Maya", "Arjun"] }),
    createEvent({ id: "evt-review", calendarId: "work", title: "Design critique", location: "Figma board", start: at(now, 0, 11), end: at(now, 0, 12), attendees: ["Design team"] }),
    createEvent({ id: "evt-lunch", calendarId: "personal", title: "Lunch with Nikhil", location: "Market Street", start: at(now, 0, 13), end: at(now, 0, 14) }),
    createEvent({ id: "evt-build", calendarId: "focus", title: "Deep work: launch polish", location: "Desk", start: at(now, 0, 15), end: at(now, 0, 17, 30) }),
    createEvent({ id: "evt-gym", calendarId: "personal", title: "Strength training", location: "Gym", start: at(now, 1, 7), end: at(now, 1, 8) }),
    createEvent({ id: "evt-demo", calendarId: "work", title: "Client demo", location: "Zoom", start: at(now, 2, 10), end: at(now, 2, 11) }),
    createEvent({ id: "evt-family", calendarId: "family", title: "Family dinner", location: "Home", start: at(now, 2, 19), end: at(now, 2, 21) }),
    createEvent({ id: "evt-bills", calendarId: "personal", title: "Pay utilities", location: "", start: at(now, 4, 9), end: at(now, 4, 9, 30) }),
    createEvent({ id: "evt-release", calendarId: "work", title: "Release window", location: "Ops channel", start: at(now, 5, 16), end: at(now, 5, 18) }),
    createEvent({ id: "evt-holiday", calendarId: "holidays", title: "Public holiday", location: "", start: at(now, 9, 0), end: at(now, 9, 23, 59), allDay: true })
  ];

  const reminders = [
    createReminder({ id: "rem-agenda", title: "Send product agenda", due: at(now, 0, 8, 30), priority: "high" }),
    createReminder({ id: "rem-brief", title: "Review launch brief", due: at(now, 0, 14), priority: "medium" }),
    createReminder({ id: "rem-card", title: "Buy birthday card", due: at(now, 1, 18), priority: "low" }),
    createReminder({ id: "rem-invoice", title: "Submit invoice", due: at(now, 3, 11), priority: "high" })
  ];

  return {
    version: 1,
    selectedDate,
    view: "week",
    calendars,
    events,
    reminders,
    settings: {
      defaultView: "week",
      weekStartsOn: 1,
      timeFormat: "12h",
      theme: "dark",
      uiScale: "80",
      showWeekends: true,
      notifications: true,
      density: "comfortable"
    }
  };
}

export function eventsForDate(events, dateValue) {
  return events
    .filter((event) => isSameDay(event.start, dateValue))
    .sort((a, b) => new Date(a.start) - new Date(b.start));
}

export function eventsForMonth(events, dateValue) {
  const start = startOfMonth(dateValue);
  const end = endOfMonth(dateValue);
  return events
    .filter((event) => isWithinRange(event.start, start, end))
    .sort((a, b) => new Date(a.start) - new Date(b.start));
}

export function eventsForRange(events, startValue, endValue) {
  return events
    .filter((event) => isWithinRange(event.start, startValue, endValue))
    .sort((a, b) => new Date(a.start) - new Date(b.start));
}

export function visibleEvents(events, calendars) {
  const visible = new Set(calendars.filter((calendar) => calendar.visible).map((calendar) => calendar.id));
  return events.filter((event) => visible.has(event.calendarId));
}

export function dueReminders(reminders, dateValue) {
  return reminders
    .filter((reminder) => !reminder.completed && isWithinRange(reminder.due, startOfDay(dateValue), endOfDay(dateValue)))
    .sort((a, b) => new Date(a.due) - new Date(b.due));
}

export function calendarForEvent(event, calendars) {
  return calendars.find((calendar) => calendar.id === event.calendarId) ?? calendars[0];
}
