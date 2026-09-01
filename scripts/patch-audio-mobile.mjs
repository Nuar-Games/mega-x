import fs from 'node:fs'
const path='src/audio.ts'
let source=fs.readFileSync(path,'utf8')
if(!source.includes('this.syncScene(true)')) throw new Error('scene audio unlock missing')
if(!source.includes("else if (!this.settings.muted && this.scene !== 'silent' && (!this.music || this.music.paused))")) throw new Error('mobile click-gesture music retry missing')
if(!source.includes('vsEnter: 0.90')) source=source.replace('  enter: 0.84,\n','  enter: 0.84,\n  vsEnter: 0.90,\n')
if(!source.includes("kind === 'ENTER_VS'")) source=source.replace("    if (kind === 'DRAW') this.playSfx('draw')\n    else if (kind === 'SUPPORT') this.playSfx('enter')", "    if (kind === 'DRAW') this.playSfx('draw')\n    else if (kind === 'ENTER_VS') this.playSfx('vsEnter')\n    else if (kind === 'SUPPORT') this.playSfx('enter')")
if(!source.includes("kind === 'ENTER_VS') this.playSfx('vsEnter')")) throw new Error('dedicated VS-entry SFX trigger missing')
if(!source.includes('vsEnter: 0.90')) throw new Error('dedicated VS-entry gain missing')
if(source.includes("playSfx('fight')") || /\bFIGHT\b/.test(source)) throw new Error('FIGHT announcer must stay removed')
fs.writeFileSync(path,source)
console.log('Verified mobile audio; dedicated supplied VS-entry SFX wired with no FIGHT announcer')
