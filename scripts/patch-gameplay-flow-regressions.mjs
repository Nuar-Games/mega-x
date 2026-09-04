import fs from 'node:fs'

const enginePath='supabase/functions/match-action/engine.ts'
const arenaPath='src/arena-blueprint.fragment'
let engine=fs.readFileSync(enginePath,'utf8')
let arena=fs.readFileSync(arenaPath,'utf8')

const oldSta="const cap=effectCapacity(s,target);if(player(s,target).effects.length>cap)s.pendingBoardChoice={chooser:source,target,purpose:'STA_CAPACITY',title:`${label(source)}: STA berkurang — pilih kad Effect ${label(target)} untuk dibuang.`,cardIds:player(s,target).effects.map(e=>e.card)};else s.message=`${label(target)} STA VS berubah sebanyak ${delta}.`}"
const newSta="const cap=effectCapacity(s,target);if(source!==target&&player(s,target).effects.length>cap)s.pendingBoardChoice={chooser:source,target,purpose:'STA_CAPACITY',title:`${label(source)}: STA berkurang — pilih kad Effect ${label(target)} untuk dibuang.`,cardIds:player(s,target).effects.map(e=>e.card)};else s.message=`${label(target)} STA VS berubah sebanyak ${delta}.`}"
if(!engine.includes(oldSta)) throw new Error('gameplay flow patch: modifySta anchor missing')
engine=engine.replace(oldSta,newSta)

const oldHidden="function pendingHidden(s:EngineState,kind:PendingChoice['kind'],chooser:PlayerIndex,target:PlayerIndex,remaining:number,source:string){s.pendingChoice={kind,chooser,target,remaining,hiddenOrder:shuffle([...player(s,target).hand]),sourceCardName:source}}"
const newHidden="function pendingHidden(s:EngineState,kind:PendingChoice['kind'],chooser:PlayerIndex,target:PlayerIndex,remaining:number,source:string){if(remaining<=0){s.pendingChoice=null;return}s.pendingChoice={kind,chooser,target,remaining,hiddenOrder:shuffle([...player(s,target).hand]),sourceCardName:source}}"
if(!engine.includes(oldHidden)) throw new Error('gameplay flow patch: pendingHidden anchor missing')
engine=engine.replace(oldHidden,newHidden)

const replacements=[
  ["(game.phase === 'EFFECT' && game.effectTurn === bottomPlayer)","(game.phase === 'EFFECT' && game.effectTurn === localViewer)"],
  ["(game.phase === 'ATTACK' && game.attackTurn === bottomPlayer)","(game.phase === 'ATTACK' && game.attackTurn === localViewer)"],
  ["{game.phase === 'EFFECT' && game.effectTurn === bottomPlayer && <button onClick={requestEndEffectTurn}","{game.phase === 'EFFECT' && game.effectTurn === localViewer && <button onClick={requestEndEffectTurn}"],
  ["{game.phase === 'ATTACK' && game.attackTurn === bottomPlayer && <>","{game.phase === 'ATTACK' && game.attackTurn === localViewer && <>"],
]
for(const [from,to] of replacements){if(!arena.includes(from))throw new Error(`gameplay flow patch: Arena prompt anchor missing: ${from}`);arena=arena.replace(from,to)}

fs.writeFileSync(enginePath,engine)
fs.writeFileSync(arenaPath,arena)
console.log('Repaired Kapores persistence, zero-target choice deadlocks, and authoritative Arena turn prompts')
