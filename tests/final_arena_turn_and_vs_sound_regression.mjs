import fs from 'node:fs'

const app = fs.readFileSync('src/App.tsx', 'utf8')
const css = fs.readFileSync('src/arena-stage.css', 'utf8')
const audio = fs.readFileSync('src/audio.ts', 'utf8')
const assert = (condition, message) => { if (!condition) throw new Error(message) }

assert(app.includes("activePlayer === 0 ? 'is-turn-active' : ''"), 'Final rendered P1 VS zone must follow authoritative activePlayer turn state')
assert(app.includes("activePlayer === 1 ? 'is-turn-active' : ''"), 'Final rendered P2 VS zone must follow authoritative activePlayer turn state')
assert(css.includes('.mx3-vs.is-turn-active::after'), 'Active VS zone must render a dedicated chasing-light edge')
assert(css.includes('background-position:200% 0'), 'Android-safe chase light must use ordinary animated background positions')
assert(css.includes('@keyframes mx3VSTurnChase'), 'VS turn chasing-light animation is missing')
assert(!css.includes('@property --mx3-turn-angle'), 'VS turn light must not depend on CSS @property animation on Android')

const enterEvent = "window.dispatchEvent(new CustomEvent('mega-x:motion', { detail: { kind: 'ENTER_VS' } }))"
assert(!app.includes(`setVS(bottomPlayer, focusedCard.id, 'ATK'); ${enterEvent}`), 'ATK must not emit a second App ENTER_VS event')
assert(!app.includes(`setVS(bottomPlayer, focusedCard.id, 'DEF'); ${enterEvent}`), 'DEF must not emit a second App ENTER_VS event')
assert(audio.includes("document.addEventListener('pointerdown', this.onVsEntryPointerDown, true)"), 'Audio engine must own VS confirmation on the Android user gesture')
assert(audio.includes("this.playSfx('vsEnter')"), 'Audio engine must play dedicated VS-entry sound')
assert(audio.includes('zone.dataset.vsCardId'), 'Audio engine must retain rendered VS identity fallback for opponent/non-click entry')
assert(audio.includes('vsEnter: 0.65'), 'VS-entry SFX must use balanced gain')

console.log('PASS final rendered Arena: Android-safe active VS chase light and single-authority VS-entry audio')
