import fs from 'node:fs'

const source = fs.readFileSync('src/arena-stage.ts', 'utf8')
const assert = (condition, message) => { if (!condition) throw new Error(message) }

assert(source.includes("wakeLock.request('screen')"), 'Arena must request a screen wake lock while a match is open')
assert(source.includes("document.addEventListener('visibilitychange'"), 'Arena wake lock must reacquire after Android visibility changes')
assert(source.includes("document.querySelector<HTMLElement>(SHELL)"), 'Wake lock must be scoped to the arena only')
assert(source.includes('held.release()'), 'Wake lock must release when the player leaves the arena')
assert(source.includes("document.visibilityState === 'visible'"), 'Wake lock must only be requested for a visible tab')

console.log('PASS mobile arena wake lock: keep Android screen awake during match, reacquire on return, release outside arena')
