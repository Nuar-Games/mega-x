import fs from 'node:fs'
const path='src/audio.ts'
let source=fs.readFileSync(path,'utf8')
const old=`    // Mobile-first: unlock immediately, but do not create dozens of remote Audio\n    // elements at once. SFX/voice are loaded lazily on first use.\n    this.preloadSfx('ready')\n    this.playSfx('ready')\n    this.syncScene(true)`
const replacement=`    // Spend the first mobile gesture on starting the current scene music.\n    // SFX/voice remain lazy and play on their own subsequent interactions.\n    this.syncScene(true)`
if(!source.includes(replacement)){
  if(!source.includes(old)) throw new Error('audio unlock block missing')
  source=source.replace(old,replacement)
}

const oldClick=`  private onClick = (event: Event) => {\n    if (!this.unlocked) this.unlock()\n    const target = event.target instanceof Element ? event.target.closest('button, .digital-card, .zone-card-button, .hand-card-wrap') : null`
const newClick=`  private onClick = (event: Event) => {\n    if (!this.unlocked) this.unlock()\n    // Some Android browsers reject the pointerdown play() but allow the following click.\n    // Retry the current scene music while we are still inside a real user gesture.\n    else if (!this.settings.muted && this.scene !== 'silent' && (!this.music || this.music.paused)) {\n      if (this.music?.paused) this.stopMusic()\n      this.startSceneMusic(this.scene)\n    }\n    const target = event.target instanceof Element ? event.target.closest('button, .digital-card, .zone-card-button, .hand-card-wrap') : null`
if(!source.includes(newClick)){
  if(!source.includes(oldClick)) throw new Error('audio click retry hook missing')
  source=source.replace(oldClick,newClick)
}

fs.writeFileSync(path,source)
console.log('Reserved first mobile gesture for scene audio and added click-gesture retry')
