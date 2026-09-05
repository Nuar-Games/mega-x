import fs from 'node:fs'
const audio = fs.readFileSync('src/audio.ts','utf8')
const must = (ok, msg) => { if (!ok) throw new Error(msg) }

must(audio.includes('const COIN_TOSS_GAIN = 1.0'), 'VS intro music must be raised to full user music level')
must(audio.includes('const ARENA_GAIN = 0.88'), 'Arena music gain must be raised')
must(audio.includes('card: 0.55'), 'card-selection SFX must be reduced')
must(audio.includes('if (!this.unlocked && occupied) return'), 'occupied VS must not be marked as already seen before audio unlock')
must(audio.includes("if (previous !== true && occupied) this.playSfx('vsEnter')"), 'VS entry cue transition must remain wired')

console.log('PASS audio mix: quieter card select, louder VS intro/Arena music, deferred occupied-VS cue until unlock')
