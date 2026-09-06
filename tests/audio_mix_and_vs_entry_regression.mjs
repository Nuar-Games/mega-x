import fs from 'node:fs'
const audio = fs.readFileSync('src/audio.ts','utf8')
const must = (ok, msg) => { if (!ok) throw new Error(msg) }

must(audio.includes('const COIN_TOSS_GAIN = 1.0'), 'VS intro music must be raised to full user music level')
must(audio.includes('const ARENA_GAIN = 0.88'), 'Arena music gain must be raised')
must(audio.includes('card: 0.25'), 'card-selection SFX must be substantially reduced')
must(audio.includes('if (!this.unlocked && cardId) return'), 'VS identity must remain pending before audio unlock')
must(audio.includes("previous !== cardId && cardId && performance.now() - this.lastVsEntryGestureAt > 1200) this.playSfx('vsEnter')"), 'VS entry identity fallback must react to actual card identity changes without duplicating pointerdown playback')
must(audio.includes("document.addEventListener('pointerdown', this.onVsEntryPointerDown, true)"), 'VS entry cue must have direct pointerdown authority')

console.log('PASS audio mix: quieter card select, louder VS intro/Arena music, pointerdown VS entry with de-duplicated card identity fallback')
