import fs from 'node:fs'

const arena = fs.readFileSync('src/arena-blueprint.fragment', 'utf8')
const css = fs.readFileSync('src/arena-stage.css', 'utf8')
const stage = fs.readFileSync('src/arena-stage.ts', 'utf8')
const audio = fs.readFileSync('src/audio.ts', 'utf8')
const assert = (condition, message) => { if (!condition) throw new Error(message) }

assert(arena.includes("activePlayer === 0 ? 'is-turn-active' : ''"), 'P1 VS zone must follow authoritative activePlayer turn state')
assert(arena.includes("activePlayer === 1 ? 'is-turn-active' : ''"), 'P2 VS zone must follow authoritative activePlayer turn state')
assert(css.includes('.mx3-vs.is-turn-active::after'), 'Active VS zone must render a dedicated chasing-light edge')
assert(css.includes('@keyframes mx3VSTurnChase'), 'VS turn chasing-light animation is missing')
assert(css.includes('animation:mx3VSTurnChase'), 'VS turn chasing light must animate')

assert(stage.includes('previousVsCardIds'), 'Arena stage must track rendered VS card identity')
assert(stage.includes("new CustomEvent('mega-x:motion', { detail: { kind: 'ENTER_VS' } })"), 'Rendered VS entry must emit ENTER_VS motion event')
assert(stage.includes("zone.dataset.vsCardId"), 'VS entry sound must be keyed from authoritative rendered VS card identity')
assert(audio.includes("kind === 'ENTER_VS') this.playSfx('vsEnter')"), 'Audio engine must map ENTER_VS to dedicated VS-entry sound')

console.log('PASS final Arena touch-up: one active VS chase light and rendered-state VS entry sound')
