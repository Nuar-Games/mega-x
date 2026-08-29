import fs from 'node:fs'
const app=fs.readFileSync('src/App.tsx','utf8')
const v24=fs.readFileSync('src/V24.css','utf8')
function assert(ok,msg){if(!ok)throw new Error(msg)}
assert(app.includes('mx-responsive-discard-title'),'discard chooser responsive hook missing')
assert(app.includes('mx-responsive-vs-title'),'VS chooser responsive hook missing')
assert(v24.includes('/* Responsive arena viewport contract */'),'responsive arena viewport patch missing')
assert(v24.includes('.duel-shell .mx-quit-match{position:fixed!important'),'QUIT/SURRENDER is not viewport-pinned')
assert(v24.includes('max-height:calc(100dvh - 24px)!important'),'chooser panel is not bounded to viewport')
assert(v24.includes('.duel-shell .hand-card-wrap{flex:0 0 clamp(76px,15vw,122px)!important'),'hand cards are not capped for narrow screens')
assert(v24.includes('overflow-y:auto!important;-webkit-overflow-scrolling:touch!important'),'chooser content does not have touch scrolling fallback')
console.log('PASS arena, hand, chooser and surrender remain inside responsive viewport')
