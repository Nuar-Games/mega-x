import fs from 'node:fs'
const path='src/audio.ts'
let source=fs.readFileSync(path,'utf8')
if(!source.includes('this.syncScene(true)')) throw new Error('scene audio unlock missing')
if(!source.includes("else if (!this.settings.muted && !this.resultPlayed && this.scene !== 'silent' && (!this.music || this.music.paused))")) throw new Error('mobile click-gesture music retry missing')

source=source.replace('const COIN_TOSS_GAIN = 0.78','const COIN_TOSS_GAIN = 1.0')
source=source.replace('const ARENA_GAIN = 0.58','const ARENA_GAIN = 0.88')
source=source.replace('  card: 0.95,','  card: 0.55,')
if(!source.includes('const COIN_TOSS_GAIN = 1.0')) throw new Error('VS intro music gain rebalance missing')
if(!source.includes('const ARENA_GAIN = 0.88')) throw new Error('Arena music gain rebalance missing')
if(!source.includes('card: 0.55')) throw new Error('card selection gain rebalance missing')
if(!source.includes('vsEnter: 1.25')) throw new Error('dedicated VS-entry priority gain missing')

if(!source.includes("kind === 'ENTER_VS'")) source=source.replace("    if (kind === 'DRAW') this.playSfx('draw')\n    else if (kind === 'SUPPORT') this.playSfx('enter')", "    if (kind === 'DRAW') this.playSfx('draw')\n    else if (kind === 'ENTER_VS') this.playSfx('vsEnter')\n    else if (kind === 'SUPPORT') this.playSfx('enter')")
if(!source.includes("kind === 'ENTER_VS') this.playSfx('vsEnter')")) throw new Error('dedicated VS-entry SFX trigger missing')

if(!source.includes('if (!this.unlocked && occupied) return')) {
  const anchor="      const occupied = Boolean(zone.querySelector('button, img'))\n      const previous = this.lastArenaVsOccupied[index]"
  if(!source.includes(anchor)) throw new Error('VS occupancy fallback anchor missing')
  source=source.replace(anchor,"      const occupied = Boolean(zone.querySelector('button, img'))\n      if (!this.unlocked && occupied) return\n      const previous = this.lastArenaVsOccupied[index]")
}
if(!source.includes('if (!this.unlocked && occupied) return')) throw new Error('locked VS occupancy deferral missing')

if(!source.includes('window.setInterval(() => this.syncArenaStateSfx(), 180)')) {
  const hook='    this.syncArenaStateSfx()\n  }\n\n  private unlock()'
  if(!source.includes(hook)) throw new Error('Arena state SFX startup hook missing')
  source=source.replace(hook,"    this.syncArenaStateSfx()\n    window.setInterval(() => this.syncArenaStateSfx(), 180)\n  }\n\n  private unlock()")
}
if(!source.includes('window.setInterval(() => this.syncArenaStateSfx(), 180)')) throw new Error('Arena state SFX polling missing')
if(source.includes("playSfx('fight')") || /\bFIGHT\b/.test(source)) throw new Error('FIGHT announcer must stay removed')
fs.writeFileSync(path,source)
console.log('Verified mobile audio; louder VS intro/Arena music, quieter card selection, VS entry deferred until audio unlock, no FIGHT announcer')
