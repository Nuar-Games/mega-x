import fs from 'node:fs'

const path = 'src/audio.ts'
let source = fs.readFileSync(path, 'utf8')

if (!source.includes('private fightPlayedForMatch = false')) {
  source = source.replace(
    '  private lastFightAt = 0\n',
    '  private lastFightAt = 0\n  private fightPlayedForMatch = false\n',
  )
}

if (!source.includes("if (next === 'match' && previous !== 'match') this.fightPlayedForMatch = false")) {
  source = source.replace(
    '    const previous = this.scene\n    this.scene = next\n',
    "    const previous = this.scene\n    this.scene = next\n    if (next === 'match' && previous !== 'match') this.fightPlayedForMatch = false\n",
  )
}

source = source.replace(
  "        if (/\\bFIGHT\\b/.test(text) && now - this.lastFightAt > 1300) { this.lastFightAt = now; this.playSfx('fight') }",
  "        if (/\\bFIGHT\\b/.test(text) && !this.fightPlayedForMatch) { this.fightPlayedForMatch = true; this.lastFightAt = now; this.playSfx('fight') }",
)

fs.writeFileSync(path, source)
console.log('Locked FIGHT announcer to once per match')
