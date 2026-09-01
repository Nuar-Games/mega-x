import fs from 'node:fs'
const main=fs.readFileSync('src/main.tsx','utf8')
const ui=fs.readFileSync('src/lobby-ui.ts','utf8')
const css=fs.readFileSync('src/index.css','utf8')
const audioPatch=fs.readFileSync('scripts/patch-audio-mobile.mjs','utf8')
function assert(ok,msg){if(!ok)throw new Error(msg)}
assert(main.includes("import './lobby-ui.ts'"),'lobby enhancements are not loaded')
assert(css.includes('[data-audio-panel][hidden]{display:none!important}'),'audio panel can ignore hidden state')
assert(!ui.includes('VIEW #4–#20'),'obsolete leaderboard collapse control is still active')
assert(!css.includes('.mx-ranks-collapsible'),'leaderboard stack can still be hidden by the obsolete collapse state')
assert(fs.readFileSync('src/lobby-final.css','utf8').includes('.mx-online-roster{'),'online fighter roster has no bounded scroll contract')
assert(ui.includes("document.addEventListener('pointerdown', closeAudioPanel, true)"),'audio panel does not close on outside tap')
assert(audioPatch.includes("this.music || this.music.paused") || audioPatch.includes("!this.music || this.music.paused"),'lobby music has no click-gesture retry')
console.log('PASS compact lobby: collapsible audio, full ranking, scrollable roster, music retry')
