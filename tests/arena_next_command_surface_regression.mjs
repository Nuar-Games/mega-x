import fs from 'node:fs'

const must=(ok,msg)=>{if(!ok)throw new Error(msg)}

const surfacePath='src/game/arena-next/ArenaCommandSurface.ts'
const scenePath='src/game/arena-next/prototype/ArenaPrototypeScene.ts'
const runtimePath='src/game/arena-next/ArenaNextRuntime.tsx'
const liveMainPath='src/game/arena-next/prototype/live-main.ts'

must(fs.existsSync(surfacePath),'ArenaCommandSurface.ts missing')
const surface=fs.readFileSync(surfacePath,'utf8')
const scene=fs.readFileSync(scenePath,'utf8')
const runtime=fs.readFileSync(runtimePath,'utf8')
const liveMain=fs.readFileSync(liveMainPath,'utf8')

must(surface.includes('ArenaCommandTarget'),'generic arena command target contract missing')
must(surface.includes("case 'SET_VS'"),'command surface must map SET_VS')
must(surface.includes("case 'BEGIN_ROUND'"),'command surface must map BEGIN_ROUND')
must(surface.includes("case 'SWITCH_POSITION'"),'command surface must map SWITCH_POSITION')
must(surface.includes("case 'PLAY_EFFECT'"),'command surface must map PLAY_EFFECT')
must(surface.includes("case 'END_EFFECT_TURN'"),'command surface must map END_EFFECT_TURN')
must(surface.includes("case 'ATTACK'"),'command surface must map ATTACK')
must(surface.includes("case 'PASS_ATTACK'"),'command surface must map PASS_ATTACK')
must(surface.includes("case 'RESOLVE_SELF_DISCARD'"),'command surface must map RESOLVE_SELF_DISCARD')
must(surface.includes("case 'RESOLVE_BOARD_CHOICE'"),'command surface must map RESOLVE_BOARD_CHOICE')
must(surface.includes("case 'RESOLVE_HIDDEN_CHOICE'"),'command surface must map RESOLVE_HIDDEN_CHOICE')
must(surface.includes("case 'RESOLVE_VISIBLE_EFFECT_CHOICE'"),'command surface must map RESOLVE_VISIBLE_EFFECT_CHOICE')
must(surface.includes("case 'TIE_PICK'"),'command surface must map TIE_PICK')
must(surface.includes('state.legalCommands'),'command surface must derive only from authoritative legalCommands')
must(scene.includes('setCommandDispatcher'),'Phaser scene must expose one command dispatcher boundary')
must(scene.includes('drawCommandSurface'),'Phaser scene must render the command surface')
must(scene.includes("target.kind==='HAND_CARD'"),'SET_VS must bind to hand-card targets in Phaser')
must(scene.includes("target.kind==='ACTION'"),'generic arena actions must bind to action targets in Phaser')
must(scene.includes('drawGameOver'),'Phaser scene must present GAME_OVER')
must(scene.includes("state.phase==='GAME_OVER'"),'GAME_OVER must be driven from authoritative ArenaState phase')
must(scene.includes('state.winnerIndex'),'GAME_OVER presentation must use authoritative winnerIndex')
must(runtime.includes('setCommandDispatcher'),'runtime must wire controller dispatch into Phaser scene')
must(liveMain.includes('setCommandDispatcher'),'live harness must wire the same dispatcher path')

console.log('PASS arena command surface maps the full legal-command vocabulary and GAME_OVER slice')
