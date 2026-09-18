import fs from 'node:fs'

const appPath = 'src/App.tsx'
let app = fs.readFileSync(appPath, 'utf8')

// Import: added right after the react hooks import.
const importOld = `import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'`
const importNew = `import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AppOpenHook, shouldShowAppOpenHook } from './AppOpenHook'`
if (app.includes(importNew)) {
  // already applied
} else if (app.includes(importOld)) {
  app = app.replace(importOld, importNew)
} else {
  throw new Error('AppOpenHook import anchor missing')
}

// State: declared alongside onlineScreen, the first piece of top-level state.
const stateOld = `  const [onlineScreen, setOnlineScreen] = useState<'LANDING' | 'AUTH' | 'HANDLE' | 'LOBBY' | 'GAME'>(() => { try { return sessionStorage.getItem('mx-enter-lobby-after-auth') === '1' ? 'LOBBY' : 'LANDING' } catch { return 'LANDING' } })`
const stateNew = `  const [showColdOpen, setShowColdOpen] = useState(shouldShowAppOpenHook)
  const [onlineScreen, setOnlineScreen] = useState<'LANDING' | 'AUTH' | 'HANDLE' | 'LOBBY' | 'GAME'>(() => { try { return sessionStorage.getItem('mx-enter-lobby-after-auth') === '1' ? 'LOBBY' : 'LANDING' } catch { return 'LANDING' } })`
if (app.includes(stateNew)) {
  // already applied
} else if (app.includes(stateOld)) {
  app = app.replace(stateOld, stateNew)
} else {
  throw new Error('showColdOpen state anchor missing')
}

// Render gate: takes priority over every other screen, including VS_INTRO —
// this must be the literal first thing a cold load can show.
const gateOld = `  if (activeOnlineMatch && onlineSession && (activeOnlineMatch.status as string) === 'VS_INTRO') {`
const gateNew = `  if (showColdOpen) {
    return <AppOpenHook onComplete={() => setShowColdOpen(false)} />
  }

  if (activeOnlineMatch && onlineSession && (activeOnlineMatch.status as string) === 'VS_INTRO') {`
if (app.includes('if (showColdOpen) {')) {
  // already applied
} else if (app.includes(gateOld)) {
  app = app.replace(gateOld, gateNew)
} else {
  throw new Error('cold-open render gate anchor missing')
}

fs.writeFileSync(appPath, app)
console.log('Patched: app-open cold-open hook wired in ahead of every other screen')
