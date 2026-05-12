# Clendr Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a static-export Next.js calendar app with localStorage persistence and Fantastical-inspired UI parity.

**Architecture:** Keep calendar behavior in small TypeScript utilities and render the app as a client-side Next.js application. Persist all mutable state through a versioned localStorage snapshot with seed data on first launch.

**Tech Stack:** Next.js, React, TypeScript, date-fns, lucide-react, Vitest, GitHub CLI.

---

### Task 1: Bootstrap

**Files:** `package.json`, `next.config.ts`, `tsconfig.json`, `app/*`, `components/*`, `lib/*`, `tests/*`

- [x] Create static-export Next.js project files.
- [ ] Add failing tests for seed data, localStorage snapshot behavior, and date filtering.
- [ ] Implement state utilities until tests pass.
- [ ] Build the complete interactive calendar UI.
- [ ] Run `npm test` and `npm run build`.
- [ ] Initialize Git, create the GitHub repository, commit, and push.

