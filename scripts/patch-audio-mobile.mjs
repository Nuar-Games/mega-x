import fs from 'node:fs'
const path='src/audio.ts'
let source=fs.readFileSync(path,'utf8')
const old=`    // Mobile-first: unlock immediately, but do not create dozens of remote Audio\n    // elements at once. SFX/voice are loaded lazily on first use.\n    this.preloadSfx('ready')\n    this.playSfx('ready')\n    this.syncScene(true)`
const replacement=`    // Spend the first mobile gesture on starting the current scene music.\n    // SFX/voice remain lazy and play on their own subsequent interactions.\n    this.syncScene(true)`
if(!source.includes(replacement)){
  if(!source.includes(old)) throw new Error('audio unlock block missing')
  source=source.replace(old,replacement)
}
fs.writeFileSync(path,source)
console.log('Reserved first mobile gesture for scene audio startup')
