import fs from 'node:fs'
const path='src/audio.ts'
let source=fs.readFileSync(path,'utf8')
if(!source.includes('this.syncScene(true)')) throw new Error('scene audio unlock missing')
if(!source.includes("else if (!this.settings.muted && !this.resultPlayed && this.scene !== 'silent' && (!this.music || this.music.paused))")) throw new Error('mobile click-gesture music retry missing')

source=source.replace('const COIN_TOSS_GAIN = 0.78','const COIN_TOSS_GAIN = 1.0')
source=source.replace('const ARENA_GAIN = 0.58','const ARENA_GAIN = 0.88')
source=source.replace('  card: 0.95,','  card: 0.25,')
source=source.replace('  card: 0.55,','  card: 0.25,')
if(!source.includes('const COIN_TOSS_GAIN = 1.0')) throw new Error('VS intro music gain rebalance missing')
if(!source.includes('const ARENA_GAIN = 0.88')) throw new Error('Arena music gain rebalance missing')
if(!source.includes('card: 0.25')) throw new Error('card selection gain rebalance missing')
if(!source.includes('vsEnter: 1.25')) throw new Error('dedicated VS-entry priority gain missing')

if(!source.includes("kind === 'ENTER_VS'")) source=source.replace("    if (kind === 'DRAW') this.playSfx('draw')\n    else if (kind === 'SUPPORT') this.playSfx('enter')", "    if (kind === 'DRAW') this.playSfx('draw')\n    else if (kind === 'ENTER_VS') this.playSfx('vsEnter')\n    else if (kind === 'SUPPORT') this.playSfx('enter')")
if(!source.includes("kind === 'ENTER_VS') this.playSfx('vsEnter')")) throw new Error('dedicated VS-entry SFX trigger missing')

source=source.replace('  private lastArenaVsOccupied: [boolean | null, boolean | null] = [null, null]','  private lastArenaVsCardIds: [string | null, string | null] = [null, null]')
source=source.replace('    this.lastArenaVsOccupied = [null, null]','    this.lastArenaVsCardIds = [null, null]')
const oldVsBlock=`      const occupied = Boolean(zone.querySelector('button, img'))\n      const previous = this.lastArenaVsOccupied[index]\n      if (previous !== true && occupied) this.playSfx('vsEnter')\n      this.lastArenaVsOccupied[index] = occupied`
const oldDeferredVsBlock=`      const occupied = Boolean(zone.querySelector('button, img'))\n      if (!this.unlocked && occupied) return\n      const previous = this.lastArenaVsOccupied[index]\n      if (previous !== true && occupied) this.playSfx('vsEnter')\n      this.lastArenaVsOccupied[index] = occupied`
const newVsBlock=`      const cardId = zone.dataset.vsCardId || null\n      if (!this.unlocked && cardId) return\n      const previous = this.lastArenaVsCardIds[index]\n      if (previous !== cardId && cardId) this.playSfx('vsEnter')\n      this.lastArenaVsCardIds[index] = cardId`
if(source.includes(oldDeferredVsBlock)) source=source.replace(oldDeferredVsBlock,newVsBlock)
else if(source.includes(oldVsBlock)) source=source.replace(oldVsBlock,newVsBlock)
if(!source.includes('lastArenaVsCardIds')) throw new Error('VS card identity state missing')
if(!source.includes('zone.dataset.vsCardId')) throw new Error('VS card identity reader missing')
if(!source.includes('previous !== cardId && cardId')) throw new Error('VS card identity transition trigger missing')

if(!source.includes("target.closest('.mx3-card-overlay-actions')")) {
  const clickAnchor="    const label = (target.textContent ?? '').replace(/\\s+/g, ' ').trim().toUpperCase()\n"
  if(!source.includes(clickAnchor)) throw new Error('audio click label anchor missing')
  const directVsGesture="    if ((label === 'ATK' || label === 'DEF') && target.closest('.mx3-card-overlay-actions') && document.querySelector('.mx3-canvas.phase-set_vs')) { this.playSfx('vsEnter'); return }\n"
  source=source.replace(clickAnchor,clickAnchor+directVsGesture)
}
if(!source.includes("label === 'ATK' || label === 'DEF'")) throw new Error('direct VS confirmation gesture SFX fallback missing')
if(!source.includes("target.closest('.mx3-card-overlay-actions')")) throw new Error('direct VS confirmation gesture must stay scoped to VS action controls')
if(!source.includes("document.querySelector('.mx3-canvas.phase-set_vs')")) throw new Error('direct VS confirmation gesture must stay scoped to SET_VS')

const broadResult="    if (/PERLAWANAN\\s+TAMAT|MENANG!?|KALAH|YOU\\s+WIN|YOU\\s+LOSE|ANDA\\s+MENANG/.test(text)) this.playResultMusic()"
const gatedResult="    if (document.querySelector('.mx3-canvas.phase-game_over')) this.playResultMusic()"
if(source.includes(broadResult)) source=source.replace(broadResult,gatedResult)
if(!source.includes(gatedResult)) throw new Error('result music GAME_OVER phase gate missing')

if(!source.includes('window.setInterval(() => this.syncArenaStateSfx(), 180)')) {
  const hook='    this.syncArenaStateSfx()\n  }\n\n  private unlock()'
  if(!source.includes(hook)) throw new Error('Arena state SFX startup hook missing')
  source=source.replace(hook,"    this.syncArenaStateSfx()\n    window.setInterval(() => this.syncArenaStateSfx(), 180)\n  }\n\n  private unlock()")
}
if(!source.includes('window.setInterval(() => this.syncArenaStateSfx(), 180)')) throw new Error('Arena state SFX polling missing')

// Prompt sound is edge-triggered from the live prompt UI, never from arbitrary DOM mutations.
source=source.replace('  private lastPromptAt = 0\n','')
const oldPrompt=`  private maybePlayPrompt(text: string) {\n    const match = text.match(/PILIH\\s+(?:KAD|VS|SASARAN|TARGET)|SELECT\\s+(?:CARD|TARGET)|CHOOSE\\s+(?:CARD|TARGET)/)\n    if (!match) return\n    const prompt = match[0]; const now = performance.now()\n    if (prompt === this.lastPrompt && now - this.lastPromptAt < 1200) return\n    this.lastPrompt = prompt; this.lastPromptAt = now; this.playSfx('prompt')\n  }`
const newPrompt=`  private syncPromptSfx() {\n    const promptNodes = Array.from(document.querySelectorAll<HTMLElement>('.mx3-phase-prompt strong, .mx3-target-selection-title'))\n    const prompt = promptNodes.map((node) => (node.textContent ?? '').replace(/\\s+/g, ' ').trim().toUpperCase()).find((text) => /PILIH\\s+(?:KAD|VS|SASARAN|TARGET)|SELECT\\s+(?:CARD|TARGET)|CHOOSE\\s+(?:CARD|TARGET)/.test(text)) ?? ''\n    if (!prompt) { this.lastPrompt = ''; return }\n    if (prompt === this.lastPrompt) return\n    this.lastPrompt = prompt\n    this.playSfx('prompt')\n  }`
if(source.includes(oldPrompt)) source=source.replace(oldPrompt,newPrompt)
if(!source.includes('private syncPromptSfx()')) throw new Error('edge-triggered prompt synchronizer missing')
source=source.replace('    this.syncArenaStateSfx()\n    for (const mutation of mutations) {','    this.syncArenaStateSfx()\n    this.syncPromptSfx()\n    for (const mutation of mutations) {')
source=source.replace('        this.maybePlayPrompt(text)\n','')
if(!source.includes('if (prompt === this.lastPrompt) return')) throw new Error('same prompt replay guard missing')
if(!source.includes("if (!prompt) { this.lastPrompt = ''; return }")) throw new Error('prompt latch reset missing')
if(source.includes('lastPromptAt')) throw new Error('time-based prompt debounce must be removed')

if(source.includes("playSfx('fight')") || /\bFIGHT\b/.test(source)) throw new Error('FIGHT announcer must stay removed')
fs.writeFileSync(path,source)
console.log('Verified mobile audio; VS entry now also fires directly from the ATK/DEF confirmation gesture, with card-identity fallback retained')
