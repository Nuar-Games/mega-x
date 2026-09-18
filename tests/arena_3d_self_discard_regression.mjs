import fs from 'node:fs'

const must=(ok,msg)=>{if(!ok)throw new Error(msg)}
const patch=fs.readFileSync('scripts/patch-self-discard-3d-bridge.mjs','utf8')
const adapter=fs.readFileSync('src/game/arena/ArenaStateAdapter.ts','utf8')
const hud=fs.readFileSync('src/game/arena3d/Arena3DHUD.tsx','utf8')
const css=fs.readFileSync('src/game/arena3d/arena3d.css','utf8')
const build=fs.readFileSync('scripts/build-clean.mjs','utf8')
const verify=fs.readFileSync('scripts/verify-all.mjs','utf8')
const materialize=fs.readFileSync('.github/workflows/materialize-clean-source.yml','utf8')
const generatedApp=fs.existsSync('src/App.tsx')?fs.readFileSync('src/App.tsx','utf8'):null

must(patch.includes("{game.pendingSelfDiscard && passToPlayer === null && pendingChoice === null && ("),'self-discard patch must anchor to the authoritative generated condition')
must(patch.includes("data-pending-discard-reason={game.pendingSelfDiscard.reason}"),'generated self-discard panel must expose reason metadata')
must(patch.includes("data-pending-discard-mode={game.pendingSelfDiscard.mode}"),'generated self-discard panel must expose mode metadata')
must(patch.includes("data-pending-discard-count={game.pendingSelfDiscard.count}"),'generated self-discard panel must expose count metadata')
must(adapter.includes("pendingSelfDiscard:{reason:string;mode:'ANY'|'EXACT';count:number;cards:(ArenaCardRef&{selected:boolean})[];confirmActionId?:string;confirmDisabled:boolean}|null"),'arena state must expose pending self-discard')
must(adapter.includes(".choice-overlay .discard-card-choice"),'discard card controls must enter the authoritative action bridge')
must(adapter.includes(".choice-overlay .discard-confirm"),'discard confirm must enter the authoritative action bridge')
must(adapter.includes("classList.contains('is-selected')"),'arena state must preserve local discard selection state')
must(adapter.includes("confirmDisabled:!confirmActionId"),'confirm disabled state must follow authoritative action availability')
must(hud.includes("state.pendingSelfDiscard?<div className=\"mx3d-chooser\""),'3D HUD must prioritize pending self-discard')
must(hud.indexOf("state.pendingSelfDiscard?<div className=\"mx3d-chooser\"")<hud.indexOf("state.pendingChoice?<div className=\"mx3d-chooser\""),'self-discard must take precedence over pending choice')
must(hud.includes("SAHKAN BUANG"),'3D HUD must expose self-discard confirmation')
must(hud.includes("card.selected?'is-selected':''"),'3D HUD must visibly preserve selected discard cards')
must(css.includes("body.mx-arena-3d-enabled .choice-overlay:has(.discard-panel[data-pending-discard-reason])"),'supported legacy discard overlay must be disabled while 3D is active')
must(build.includes("'patch-self-discard-3d-bridge.mjs'"),'build prepare must run self-discard patch')
must(build.includes("'arena_3d_self_discard_regression.mjs'"),'build must run self-discard regression')
must(verify.includes("entry.name.endsWith('_regression.mjs')"),'npm test must discover every regression file instead of hardcoding a short list')
must(materialize.includes('node scripts/build-clean.mjs --prepare-only'),'generated-source verification must use the authoritative build prepare chain')
must(materialize.includes('Generated source drift detected'),'generated-source verification must fail on drift instead of self-mutating the branch')
if(generatedApp){
  must(generatedApp.includes('<div className="choice-panel discard-panel" data-pending-discard-reason={game.pendingSelfDiscard.reason} data-pending-discard-mode={game.pendingSelfDiscard.mode} data-pending-discard-count={game.pendingSelfDiscard.count}>'),'generated App must contain self-discard 3D bridge metadata on the discard panel')
}

console.log('PASS Mega X 3D self-discard bridge contract')
