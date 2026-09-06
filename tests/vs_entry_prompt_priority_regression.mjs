import fs from 'node:fs'

const source = fs.readFileSync('src/audio.ts', 'utf8')
const app = fs.readFileSync('src/App.tsx', 'utf8')
const assert = (condition, message) => { if (!condition) throw new Error(message) }

assert(source.includes('private suppressPromptUntil = 0'), 'VS entry must own a prompt-suppression window')
assert(source.includes('this.suppressPromptUntil = performance.now() + 1400'), 'VS confirmation must suppress prompt audio for the same transition')
assert(source.includes("this.playSfx('vsEnter')"), 'VS confirmation must still fire the dedicated VS-entry sound')
assert(source.includes('if (performance.now() < this.suppressPromptUntil)'), 'Prompt synchronizer must honor VS-entry priority')
assert(source.includes("if (prompt.includes('PILIH KAD VS')) return"), 'VS-selection prompt must be skipped during the VS-entry priority window')

assert(!app.includes("setVS(bottomPlayer, focusedCard.id, 'ATK'); window.dispatchEvent(new CustomEvent('mega-x:motion', { detail: { kind: 'ENTER_VS' } }))"), 'ATK confirmation must not double-fire ENTER_VS from App after pointerdown already played it')
assert(!app.includes("setVS(bottomPlayer, focusedCard.id, 'DEF'); window.dispatchEvent(new CustomEvent('mega-x:motion', { detail: { kind: 'ENTER_VS' } }))"), 'DEF confirmation must not double-fire ENTER_VS from App after pointerdown already played it')
assert(source.includes('vsEnter: 0.65'), 'VS-entry SFX gain must be reduced to 0.65')

console.log('PASS VS-entry audio owns the prompt transition, fires once, and uses balanced gain')
