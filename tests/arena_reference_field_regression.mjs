import fs from 'node:fs'
const scene=fs.readFileSync('src/game/arena/ArenaScene.ts','utf8')
const cards=fs.readFileSync('src/game/arena/ArenaCards.ts','utf8')
const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
must(scene.includes('const fieldSlots=5'),'Desktop combat field must use five authored card-sized slots')
must(scene.includes('fieldNeutral')&&scene.includes('fieldBlue')&&scene.includes('fieldRed'),'Battle field must use neutral/blue/red authored slot frames')
must(!scene.includes('const zoneW=Math.max(120,(combat.width-zoneGap*3)/2)'),'Arena must not render two giant half-screen field boxes')
must(cards.includes('const vsCardH=Math.min(layout.combat.height*0.68,310)'),'Active VS cards must be capped to tactical card size')
must(cards.includes('vsGap=Math.max(28,layout.combat.width*0.055)'),'Active VS cards must sit around the central clash axis')
console.log('PASS reference tactical battle field')
