# Clendr

Clendr is a Fantastical-inspired public calendar built as a static-export Next.js application. It is fully browser-local for now: calendars, events, reminders, settings, selected view, and UI state persist in `localStorage`.

## Features

- Day, week, month, agenda, and year calendar views
- Event creation, editing, deletion, duplication, status, recurrence, notes, and locations
- Reminder creation, completion, due dates, and priorities
- Calendar visibility controls and editable calendar names/colors
- Settings for default view, week start, time format, density, and notifications
- JSON import/export backup for local browser data
- Static artifact generation through `next build`

## Run

```bash
npm install --registry=https://registry.npmmirror.com
npm run dev -- -p 3001
```

Open `http://localhost:3001`.

## Verify

```bash
npm test
npm run build
npx --yes --registry=https://registry.npmmirror.com playwright test tests/smoke.spec.js --reporter=line
```

The production build exports static files into `out/`.

## Figma Source

The visual direction is based on the Fantastical Calendar community sample:
`https://www.figma.com/community/file/947605801739128787/fantastical-calendar`

The current implementation recreates the visible Fantastical-style app manually as a working product surface. A later parity pass can map exact Figma component metadata if API access or exported component assets are provided.

