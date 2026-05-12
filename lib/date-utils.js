export const DAY_MS = 24 * 60 * 60 * 1000;

export function toDate(value) {
  return value instanceof Date ? new Date(value) : new Date(value);
}

export function startOfDay(value) {
  const date = toDate(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(value) {
  const date = startOfDay(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function addDays(value, amount) {
  const date = toDate(value);
  date.setDate(date.getDate() + amount);
  return date;
}

export function startOfWeek(value, weekStartsOn = 1) {
  const date = startOfDay(value);
  const diff = (date.getDay() - weekStartsOn + 7) % 7;
  return addDays(date, -diff);
}

export function startOfMonth(value) {
  const date = startOfDay(value);
  date.setDate(1);
  return date;
}

export function endOfMonth(value) {
  const date = startOfMonth(value);
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function addMonths(value, amount) {
  const date = toDate(value);
  date.setMonth(date.getMonth() + amount);
  return date;
}

export function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function isWithinRange(value, start, end) {
  const time = toDate(value).getTime();
  return time >= toDate(start).getTime() && time <= toDate(end).getTime();
}

export function iso(value) {
  return toDate(value).toISOString();
}

export function formatDayKey(value) {
  const date = toDate(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatMonthLabel(value) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(toDate(value));
}

export function formatWeekday(value, format = "short") {
  return new Intl.DateTimeFormat("en", { weekday: format }).format(toDate(value));
}

export function formatTime(value, mode = "12h") {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    hour12: mode === "12h"
  }).format(toDate(value));
}

export function formatDateInput(value) {
  return formatDayKey(value);
}

export function formatTimeInput(value) {
  return iso(value).slice(11, 16);
}

export function combineDateAndTime(dateValue, timeValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return iso(date);
}

export function monthGrid(value, weekStartsOn = 1) {
  const monthStart = startOfMonth(value);
  const first = startOfWeek(monthStart, weekStartsOn);
  return Array.from({ length: 42 }, (_, index) => addDays(first, index));
}

export function weekDays(value, weekStartsOn = 1) {
  const first = startOfWeek(value, weekStartsOn);
  return Array.from({ length: 7 }, (_, index) => addDays(first, index));
}
