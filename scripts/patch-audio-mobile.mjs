import fs from 'node:fs'
const path='src/audio.ts'
let source=fs.readFileSync(path,'utf8')

// Current replacement-audio build already reserves the first mobile gesture for scene music.
// Only patch legacy branches that still trigger the removed ready/voice bootstrap.
const legacyUnlock=`    // Mobile-first: unlock immediately, but do not create dozens of remote Audio\n    // elements at once. SFX/voice are loaded lazily on first use.\n    this.preloadSfx('ready')\n    this.playSfx('ready')\n    this.syncScene(true)`
const currentUnlock=`    // Spend the first mobile gesture on starting the current scene music.\n    this.syncScene(true)`
if(source.includes(legacyUnlock)) source=source.replace(legacyUnlock,currentUnlock)
if(!source.includes('this.syncScene(true)')) throw new Error('scene audio unlock missing')

const oldClick=`  private onClick = (event: Event) => {\n    if (!this.unlocked) this.unlock()\n    const target = event.target instanceof Element ? event.target.closest('button, .digital-card, .zone-card-button, .hand-card-wrap') : null`
const newClick=`  private onClick = (event: Event) => {\n    if (!this.unlocked) this.unlock()\n    // Some Android browsers reject the pointerdown play() but allow the following click.\n    // Retry the current scene music while we are still inside a real user gesture.\n    else if (!this.settings.muted && this.scene !== 'silent' && (!this.music || this.music.paused)) {\n      if (this.music?.paused) this.stopMusic()\n      this.startSceneMusic(this.scene)\n    }\n    const target = event.target instanceof Element ? event.target.closest('button, .digital-card, .zone-card-button, .hand-card-wrap') : null`
if(!source.includes(newClick)){
  if(!source.includes(oldClick)) throw new Error('audio click retry hook missing')
  source=source.replace(oldClick,newClick)
}

fs.writeFileSync(path,source)
console.log('Verified mobile scene-audio unlock and added click-gesture retry')
