import fs from 'node:fs'

const patch = fs.readFileSync('scripts/patch-critical-gameplay.mjs','utf8')
const audio = fs.readFileSync('src/audio.ts','utf8')
const must = (ok, msg) => { if (!ok) throw new Error(msg) }

must(patch.includes("detail: { kind: 'ENTER_VS' }"), 'SET_VS path must explicitly dispatch ENTER_VS audio event')
must(patch.includes("dispatchOnlineAction('SET_VS', { cardId, position })"), 'authoritative online SET_VS action path missing')
must(audio.includes("label === 'ATK' || label === 'DEF'"), 'VS placement must have a direct user-gesture audio fallback on ATK/DEF confirmation')
must(audio.includes("target.closest('.mx3-card-overlay-actions')"), 'VS placement direct audio fallback must be scoped to the selected-card VS action controls')
must(audio.includes("document.querySelector('.mx3-canvas.phase-set_vs')"), 'VS placement direct audio fallback must only run during SET_VS')
must(audio.includes("this.playSfx('vsEnter')"), 'VS placement direct audio fallback must play the dedicated VS-entry SFX')

console.log('PASS VS entry audio has explicit SET_VS dispatch plus direct ATK/DEF user-gesture fallback')
