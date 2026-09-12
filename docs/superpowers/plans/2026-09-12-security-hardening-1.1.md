# Security Hardening 1.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden Mega X 1.1 without changing gameplay state behavior, add password recovery and moderation regression coverage, align release metadata, and prove stability with automated QA/stress testing.

**Architecture:** Keep `main` frozen. Work only on `security-hardening-1.1`. Implement auth/security changes through isolated migration/patch/test files, preserve the existing authoritative match engine, and reject any change that breaks existing engine/Practice regressions.

**Tech Stack:** React 19, TypeScript, Vite, Supabase Auth/Postgres/RPC, Vercel.

**Spec:** Audit findings and approved three-pass workflow from 2026-09-12.

## Global Constraints

- Do not modify gameplay rules, card behavior, match state transitions, Practice lifecycle, tie-breaker behavior, or authoritative match-action semantics.
- Keep `main` untouched until all passes are verified.
- TDD for behavior changes: regression first, prove red, then implement green.
- Full verification must include engine 32/32, 200-match Practice stress, Supabase security advisor, admin/auth regressions, production-style build, and preview runtime checks.
- Bundle/build cleanup is optional and only after security/auth/admin/version verification is green.

---

### Task 1: Pass 1 — Supabase permission hardening

**Files:**
- Create: `supabase/migrations/20260912_security_definer_hardening.sql`
- Create: `tests/security_permissions_regression.mjs`
- Modify: `package.json`

- [ ] Add failing regression asserting internal/trigger/admin helpers are not exposed to anon and trigger-only helpers are not callable by authenticated users.
- [ ] Run branch build and confirm expected RED.
- [ ] Add least-privilege migration: revoke PUBLIC/anon on private helpers; preserve only intentional public landing metrics/visit RPCs; keep authenticated client RPCs explicitly granted.
- [ ] Apply non-destructive migration to Supabase.
- [ ] Verify live grants from `information_schema.routine_privileges` and rerun security advisor.

### Task 2: Pass 1 — Password recovery

**Files:**
- Create: `scripts/patch-password-recovery.mjs`
- Create: `tests/password_recovery_regression.mjs`
- Modify: `package.json`

**Interfaces:**
- `requestPasswordReset(email: string): Promise<void>`
- `consumeRecoverySessionFromHash(): OnlineSession | null`
- `updatePassword(session: OnlineSession, password: string): Promise<void>`

- [ ] Add failing auth regression requiring reset request, recovery token consumption, update-password endpoint, and visible Forgot Password / Reset Password UI states.
- [ ] Confirm RED on preview build.
- [ ] Implement minimal Supabase Auth recovery endpoints and generated-App patch.
- [ ] Verify GREEN build and preview auth surface without altering normal sign-in/signup/session behavior.

### Task 3: Pass 2 — Admin regression coverage

**Files:**
- Create: `tests/admin_controls_regression.mjs`
- Modify: `package.json`

- [ ] Add regression coverage for admin status/list/mute/unmute/ban/unban wiring and non-admin rejection contract.
- [ ] Verify generated App contains admin-only UI gate and backend migration contains server-side guards.
- [ ] Keep moderation behavior unchanged unless a test exposes a defect.

### Task 4: Pass 2 — Release metadata

**Files:**
- Modify: `package.json`

- [ ] Change package version from `1.0.0` to `1.1.0`.
- [ ] Add regression assertion preventing a stale 1.0.0 package version on this branch.

### Task 5: Pass 3 — Automated QA and stress verification

**Files:**
- Modify only if a verification defect requires a narrowly scoped fix.

- [ ] Run complete Vercel branch build.
- [ ] Confirm all existing Arena/card/audio/mobile regressions.
- [ ] Confirm `ENGINE_BEHAVIOR 32/32 passed`.
- [ ] Confirm `PRACTICE_STRESS_PASS 200 seeded matches`.
- [ ] Confirm `GATE1_VERIFY_PASS`.
- [ ] Confirm auth/security/admin/version regressions.
- [ ] Rerun Supabase security and performance advisors.
- [ ] Check branch preview runtime errors.
- [ ] Compare `main...security-hardening-1.1` and verify no gameplay engine files changed unexpectedly.

### Task 6: Pass 3 — Optional low-risk cleanup only

- [ ] Inspect bundle warning/build patch fragility after all required gates pass.
- [ ] Do not restructure core generated-App architecture in this branch.
- [ ] Only accept zero-behavior-change cleanup backed by regressions; otherwise defer to a later release.
