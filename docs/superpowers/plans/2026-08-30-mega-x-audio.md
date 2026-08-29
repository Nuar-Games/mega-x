# MEGA-X Audio System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add original SFX, lobby music, match music, announcer voice, and persistent audio controls without touching authoritative gameplay logic.

**Architecture:** `src/audio.ts` owns all audio behavior and observes rendered UI state. `src/main.tsx` imports it once. Browser Web Audio synthesizes music/SFX and Speech Synthesis provides announcer lines.

**Tech Stack:** TypeScript, Web Audio API, Web Speech API, DOM MutationObserver, localStorage.

**Spec:** `docs/superpowers/specs/2026-08-30-mega-x-audio-design.md`

## Global Constraints
- No external or copied game audio assets.
- No Supabase, match-action, or gameplay-state writes from audio code.
- Audio must remain autoplay-safe and unlock only after user gesture.
- Music/SFX/Voice volumes and mute persist locally.

---

### Task 1: Audio regression gate

**Files:**
- Create: `tests/audio_system_regression.mjs`

**Interfaces:**
- Consumes: `src/audio.ts`, `src/main.tsx`
- Produces: build-time structural gate for the complete audio subsystem.

- [ ] **Step 1: Write the failing test** asserting the main bootstrap import and audio engine markers.
- [ ] **Step 2: Run** `node tests/audio_system_regression.mjs`; expected failure is missing `src/audio.ts` or bootstrap import.
- [ ] **Step 3: Keep the test unchanged while implementing Tasks 2-3.**
- [ ] **Step 4: Run** `node tests/audio_system_regression.mjs`; expected output begins `PASS MEGA-X audio system`.

### Task 2: Browser audio engine

**Files:**
- Create: `src/audio.ts`

**Interfaces:**
- Produces: `detectAudioScene()`, `announcementForText()`, browser bootstrap side effect.

- [ ] **Step 1:** Implement lobby/match/silent scene detection with match taking priority.
- [ ] **Step 2:** Implement generated lobby and match sequences with Web Audio.
- [ ] **Step 3:** Implement SFX for UI, cards, attack, pass, and blocked attack.
- [ ] **Step 4:** Implement Speech Synthesis announcer cues and duplicate suppression.
- [ ] **Step 5:** Implement persistent Music/SFX/Voice sliders and mute.
- [ ] **Step 6:** Run `tsc --noEmit`; expected zero errors.

### Task 3: Bootstrap and build gate

**Files:**
- Modify: `src/main.tsx`
- Modify: `package.json`

**Interfaces:**
- Consumes: side-effect module `./audio.ts`
- Produces: one-time audio startup and mandatory regression execution during `npm run build`.

- [ ] **Step 1:** Import `./audio.ts` from `src/main.tsx` before rendering `App`.
- [ ] **Step 2:** Add `node tests/audio_system_regression.mjs` to the existing build chain before the gameplay audits.
- [ ] **Step 3:** Run `node tests/audio_system_regression.mjs`; expected PASS.
- [ ] **Step 4:** Run the full `npm run build` when deployment/build capacity is available; expected all regressions, TypeScript, and Vite build to pass.
