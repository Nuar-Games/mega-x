import fs from 'node:fs'

const app = fs.readFileSync('src/App.tsx', 'utf8')
const css = fs.readFileSync('src/arena-stage.css', 'utf8')
const stage = fs.readFileSync('src/arena-stage.ts', 'utf8')
const audio = fs.readFileSync('src/audio.ts', 'utf8')
const assert = (condition, message) => { if (!condition) throw new Error(message) }

assert(app.includes("activePlayer === 0 ? 'is-turn-active' : ''"), 'Final rendered P1 VS zone must follow authoritative activePlayer turn state')
assert(app.includes("activePlayer === 1 ? 'is-turn-active' : ''"), 'Final rendered P2 VS zone must follow authoritative activePlayer turn state')
assert(css.includes('.mx3-vs.is-turn-active::after'), 'Active VS zone must render a dedicated chasing-light edge')
assert(css.includes('background-position:200% 0'), 'Android-safe chase light must use ordinary animated background positions')
assert(css.includes('@keyframes mx3VSTurnChase'), 'VS turn chasing-light animation is missing')
assert(!css.includes('@property --mx3-turn-angle'), 'VS turn light must not depend on CSS @property animation on Android')

const enterEvent = "window.dispatchEvent(new CustomEvent('mega-x:motion', { detail: { kind: 'ENTER_VS' } }))"
assert(app.includes(`setVS(bottomPlayer, focusedCard.id, 'ATK'); ${enterEvent}`), 'ATK VS confirmation must fire VS-entry sound in the user gesture')
assert(app.includes(`setVS(bottomPlayer, focusedCard.id, 'DEF'); ${enterEvent}`), 'DEF VS confirmation must fire VS-entry sound in the user gesture')
assert(stage.includes('previousVsCardIds'), 'Arena stage must retain opponent/rendered-state VS identity fallback')
assert(stage.includes("zone.dataset.vsCardId"), 'VS identity fallback must use rendered card identity')
assert(audio.includes("kind === 'ENTER_VS') this.playSfx('vsEnter')"), 'Audio engine must map ENTER_VS to dedicated VS-entry sound')

console.log('PASS final rendered Arena: Android-safe active VS chase light and direct VS-entry sound gesture')
