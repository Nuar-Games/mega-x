import fs from 'node:fs'

const source = fs.readFileSync('src/audio.ts', 'utf8')
const assert = (condition, message) => { if (!condition) throw new Error(message) }

assert(source.includes('private suppressPromptUntil = 0'), 'VS entry must own a prompt-suppression window')
assert(source.includes('this.suppressPromptUntil = performance.now() + 1400'), 'VS confirmation must suppress prompt audio for the same transition')
assert(source.includes("this.playSfx('vsEnter')"), 'VS confirmation must still fire the dedicated VS-entry sound')
assert(source.includes('if (performance.now() < this.suppressPromptUntil)'), 'Prompt synchronizer must honor VS-entry priority')
assert(source.includes("if (prompt.includes('PILIH KAD VS')) return"), 'VS-selection prompt must be skipped during the VS-entry priority window')

console.log('PASS VS-entry audio has priority over PILIH KAD VS prompt audio')
