import fs from 'node:fs'

const patch = fs.readFileSync('scripts/patch-critical-gameplay.mjs','utf8')
const audio = fs.readFileSync('src/audio.ts','utf8')
const must = (ok, msg) => { if (!ok) throw new Error(msg) }

must(patch.includes("detail: { kind: 'ENTER_VS' }"), 'SET_VS path must explicitly dispatch ENTER_VS audio event')
must(patch.includes("dispatchOnlineAction('SET_VS', { cardId, position })"), 'authoritative online SET_VS action path missing')
must(audio.includes("document.addEventListener('pointerdown', this.onVsEntryPointerDown, true)"), 'VS placement must listen on pointerdown for earliest user-gesture playback')
must(audio.includes('private onVsEntryPointerDown = (event: Event) =>'), 'dedicated VS-entry pointer handler missing')
must(audio.includes("label === 'ATK' || label === 'DEF'"), 'VS placement must only trigger on ATK/DEF confirmation')
must(audio.includes("target.closest('.mx3-card-overlay-actions')"), 'VS placement direct audio trigger must be scoped to the selected-card VS action controls')
must(audio.includes("document.querySelector('.mx3-canvas.phase-set_vs')"), 'VS placement direct audio trigger must only run during SET_VS')
must(audio.includes("this.lastVsEntryGestureAt = performance.now()"), 'VS placement direct gesture timestamp missing')
must(audio.includes("performance.now() - this.lastVsEntryGestureAt > 1200"), 'card-identity fallback must not duplicate the direct VS-entry sound')
must(audio.includes("this.playSfx('vsEnter')"), 'VS placement must play the dedicated VS-entry SFX')

console.log('PASS VS entry audio uses pointerdown authority with de-duplicated card-identity fallback')
