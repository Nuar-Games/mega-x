import fs from 'node:fs'
const scene=fs.readFileSync('src/game/arena/ArenaScene.ts','utf8')
const cards=fs.readFileSync('src/game/arena/ArenaCards.ts','utf8')
const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
// A five-slot boxed field layout was built and visually rejected (see
// arena_clean_asset_manifest_regression.mjs, which forbids it outright).
// This contract now guards against that specific regression instead of
// requiring the design that was tried and turned down.
must(!scene.includes('const fieldSlots=5'),'Arena must not lay five generic boxed field slots across combat (rejected design)')
must(!scene.includes('strokeRoundedRect(combat.x+combat.width*0.08'),'Arena must not rebuild the rejected giant bordered board')
must(!scene.includes('const zoneW=Math.max(120,(combat.width-zoneGap*3)/2)'),'Arena must not render two giant half-screen field boxes')
must(cards.includes('const vsCardH=Math.min(layout.combat.height*0.68,310)'),'Active VS cards must be capped to tactical card size')
must(cards.includes('vsGap=Math.max(28,layout.combat.width*0.055)'),'Active VS cards must sit around the central clash axis')
console.log('PASS reference tactical battle field (rejected boxed-slot design correctly avoided)')
