# Clendr Design

Clendr is a static-export Next.js calendar application inspired by the Fantastical Calendar Figma community sample. The first milestone prioritizes a professional interactive calendar with localStorage persistence, then a Figma parity pass can tighten exact component fidelity when API or exported assets are available.

## Product Scope

- Calendar shell with left sidebar, mini month picker, calendar list, main schedule canvas, inspector, command/search area, and settings surfaces.
- Views for day, week, month, agenda, and year.
- Event create, edit, delete, duplicate, complete, and search.
- Reminder create/edit/complete with due dates and priorities.
- Calendar management with colors, visibility, default calendar, and local-only storage.
- Settings for appearance, week start, time format, default view, notifications, import/export, and reset.

## Data Model

All data is browser-local for now. The app stores calendars, events, reminders, settings, and UI state in `localStorage` under a versioned key. First launch seeds realistic calendar data so the static export is useful immediately.

## Build Constraints

The app must build with `next build` and emit a static artifact via `output: "export"`. Browser-only localStorage access stays behind client components and guarded storage helpers.

## Visual Direction

The interface follows the provided Fantastical-style sample: dense professional calendar layout, translucent panels, red accent actions, compact typography, color-coded events, and settings/components represented as actual interactive controls.

