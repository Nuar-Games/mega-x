import fs from 'node:fs'

const path = 'src/arena-stage.ts'
let source = fs.readFileSync(path, 'utf8')
const marker = '// MEGA-X arena screen wake lock'

if (!source.includes(marker)) {
  source += `\n\n${marker}\nlet wakeLockSentinel: any = null\nlet wakeLockRequestPending = false\n\nfunction arenaIsOpen() {\n  return Boolean(document.querySelector<HTMLElement>(SHELL))\n}\n\nasync function syncArenaScreenWakeLock() {\n  const wakeLock = (navigator as any).wakeLock\n  const shouldHold = arenaIsOpen() && document.visibilityState === 'visible'\n\n  if (!shouldHold) {\n    if (wakeLockSentinel) {\n      const held = wakeLockSentinel\n      wakeLockSentinel = null\n      await held.release().catch(() => undefined)\n    }\n    return\n  }\n\n  if (!wakeLock || wakeLockSentinel || wakeLockRequestPending) return\n\n  wakeLockRequestPending = true\n  try {\n    const sentinel = await wakeLock.request('screen')\n    wakeLockSentinel = sentinel\n    sentinel.addEventListener('release', () => {\n      if (wakeLockSentinel === sentinel) wakeLockSentinel = null\n    })\n  } catch {\n    // Unsupported browser / OS policy: gameplay continues normally.\n  } finally {\n    wakeLockRequestPending = false\n  }\n}\n\ndocument.addEventListener('visibilitychange', () => { void syncArenaScreenWakeLock() })\nwindow.addEventListener('focus', () => { void syncArenaScreenWakeLock() })\nwindow.addEventListener('pointerdown', () => { void syncArenaScreenWakeLock() }, { passive: true })\n\nconst wakeLockArenaObserver = new MutationObserver(() => { void syncArenaScreenWakeLock() })\nwakeLockArenaObserver.observe(document.documentElement, { childList: true, subtree: true })\nvoid syncArenaScreenWakeLock()\n`
}

if (!source.includes("wakeLock.request('screen')")) throw new Error('mobile wake lock request missing')
if (!source.includes("document.addEventListener('visibilitychange'")) throw new Error('mobile wake lock visibility reacquire missing')
if (!source.includes('wakeLockSentinel.release()') && !source.includes('held.release()')) throw new Error('mobile wake lock release path missing')
if (!source.includes("document.visibilityState === 'visible'")) throw new Error('mobile wake lock visibility guard missing')

fs.writeFileSync(path, source)
console.log('Installed arena-scoped Android screen wake lock with visibility reacquire and release on arena exit')
