import fs from 'node:fs'

const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
const patch=fs.readFileSync('scripts/patch-hidden-choice-3d-bridge.mjs','utf8')
const adapter=fs.readFileSync('src/game/arena/ArenaStateAdapter.ts','utf8')
const hud=fs.readFileSync('src/game/arena3d/Arena3DHUD.tsx','utf8')
const css=fs.readFileSync('src/game/arena3d/arena3d.css','utf8')
const build=fs.readFileSync('scripts/build-clean.mjs','utf8')
const materialize=fs.readFileSync('.github/workflows/materialize-clean-source.yml','utf8')

must(patch.includes("data-pending-choice-kind={pendingChoice.kind}"),'generated hidden-choice panel must expose kind metadata')
must(patch.includes("data-pending-choice-remaining={pendingChoice.remaining}"),'generated hidden-choice panel must expose remaining metadata')
must(patch.includes("data-pending-choice-source={pendingChoice.sourceCardName}"),'generated hidden-choice panel must expose source metadata')
must(patch.includes("data-pending-choice-kind={game.pendingBoardChoice.purpose}"),'generated board-choice panel must expose purpose metadata')
must(adapter.includes("pendingChoice:{kind:string;remaining:number;sourceCardName:string;hiddenSlots:ArenaCardRef[];visibleTargets:ArenaCardRef[]}|null"),'arena state must expose hidden pending choice')
must(adapter.includes(".choice-overlay .card-back-button"),'hidden card slot controls must enter the authoritative action bridge')
must(adapter.includes(".choice-overlay .target-effect:not(.board-target-card)"),'visible PELUNCUR targets must enter the authoritative action bridge without duplicating board targets')
must(adapter.includes("choice-panel[data-pending-choice-kind]:not(.board-choice-panel)"),'board-choice metadata must not be mistaken for hidden pending choice state')
must(adapter.includes("src:'/cards/back-game.webp'"),'hidden choices must stay face-down in 3D')
must(hud.includes("state.pendingChoice?<div className=\"mx3d-chooser\""),'3D HUD must prioritize pending choice')
must(hud.includes("state.pendingChoice.visibleTargets"),'3D HUD must render visible pending targets')
must(hud.includes("state.pendingChoice.hiddenSlots"),'3D HUD must render hidden pending slots')
must(css.includes("body.mx-arena-3d-enabled .choice-overlay:has(.choice-panel[data-pending-choice-kind])"),'legacy supported choice overlay must be disabled while 3D is active')
must(build.includes("'patch-hidden-choice-3d-bridge.mjs'"),'build prepare must run hidden-choice patch')
must(materialize.includes('node scripts/patch-hidden-choice-3d-bridge.mjs'),'materialize workflow must run hidden-choice patch')

console.log('PASS Mega X 3D hidden-card choice bridge contract')
