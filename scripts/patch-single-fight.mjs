import fs from 'node:fs'

const path = 'src/audio.ts'
let source = fs.readFileSync(path, 'utf8')

// Arena DOM is authoritative once mounted. Coin-related classes can remain in the
// document during the transition, so checking them first can bounce match -> coin -> match
// and reset the FIGHT lock.
source = source.replace(
  `  private detectScene(): Scene {\n    if (this.coinTossVisible()) return 'coinToss'\n    if (document.querySelector('.duel-shell')) return 'match'\n    if (document.querySelector('.mx-online-screen, .online-lobby, .mx-lobby, [data-screen="online"]')) return 'lobby'\n    return 'silent'\n  }`,
  `  private detectScene(): Scene {\n    if (document.querySelector('.duel-shell')) return 'match'\n    if (this.coinTossVisible()) return 'coinToss'\n    if (document.querySelector('.mx-online-screen, .online-lobby, .mx-lobby, [data-screen="online"]')) return 'lobby'\n    return 'silent'\n  }`,
)

if (!source.includes('private fightPlayedForMatch = false')) {
  source = source.replace(
    '  private lastFightAt = 0\n',
    '  private lastFightAt = 0\n  private fightPlayedForMatch = false\n',
  )
}

// Reset only after the Arena has genuinely gone away. Do not reset merely because a
// transition class briefly makes the scene detector see something else.
source = source.replace(
  "    if (next === 'match' && previous !== 'match') this.fightPlayedForMatch = false\n",
  "    if (previous === 'match' && next !== 'match' && !document.querySelector('.duel-shell')) this.fightPlayedForMatch = false\n",
)

source = source.replace(
  "        if (/\\bFIGHT\\b/.test(text) && now - this.lastFightAt > 1300) { this.lastFightAt = now; this.playSfx('fight') }",
  "        if (/\\bFIGHT\\b/.test(text) && !this.fightPlayedForMatch) { this.fightPlayedForMatch = true; this.lastFightAt = now; this.playSfx('fight') }",
)

if (!source.includes("if (document.querySelector('.duel-shell')) return 'match'")) throw new Error('Arena-first scene detection missing')
if (!source.includes('!this.fightPlayedForMatch')) throw new Error('single FIGHT lock missing')

fs.writeFileSync(path, source)
console.log('Locked FIGHT to one Arena entry and made duel-shell scene authoritative')
