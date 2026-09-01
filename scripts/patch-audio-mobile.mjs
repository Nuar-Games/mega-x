import fs from 'node:fs'
const path='src/audio.ts'
const source=fs.readFileSync(path,'utf8')
if(!source.includes('this.syncScene(true)')) throw new Error('scene audio unlock missing')
if(!source.includes("else if (!this.settings.muted && this.scene !== 'silent' && (!this.music || this.music.paused))")) throw new Error('mobile click-gesture music retry missing')
if(source.includes("playSfx('fight')") || /\\bFIGHT\\b/.test(source)) throw new Error('FIGHT announcer must stay removed')
console.log('Verified mobile scene-audio unlock with no FIGHT announcer')
