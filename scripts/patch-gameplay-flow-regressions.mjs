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
  ["(game.phase === 'SET_VS' && game.needsVS[bottomPlayer] && (activeOnlineMatch || setupPlayer === bottomPlayer))","(game.phase === 'SET_VS' && game.needsVS[activeOnlineMatch ? localViewer : bottomPlayer] && (activeOnlineMatch || setupPlayer === bottomPlayer))"],
  ["(game.phase === 'EFFECT' && game.effectTurn === bottomPlayer)","(game.phase === 'EFFECT' && game.effectTurn !== null && (activeOnlineMatch ? game.effectTurn === localViewer : game.effectTurn === bottomPlayer))"],
  ["(game.phase === 'ATTACK' && game.attackTurn === bottomPlayer)","(game.phase === 'ATTACK' && game.attackTurn !== null && (activeOnlineMatch ? game.attackTurn === localViewer : game.attackTurn === bottomPlayer))"],
  ["{game.phase === 'EFFECT' && game.effectTurn === bottomPlayer && <button onClick={requestEndEffectTurn}","{game.phase === 'EFFECT' && game.effectTurn !== null && (activeOnlineMatch ? game.effectTurn === localViewer : game.effectTurn === bottomPlayer) && <button onClick={requestEndEffectTurn}"],
  ["{game.phase === 'ATTACK' && game.attackTurn === bottomPlayer && <>","{game.phase === 'ATTACK' && game.attackTurn !== null && (activeOnlineMatch ? game.attackTurn === localViewer : game.attackTurn === bottomPlayer) && <>"],
]
for(const [from,to] of replacements){if(!arena.includes(from))throw new Error(`gameplay flow patch: Arena prompt anchor missing: ${from}`);arena=arena.replace(from,to)}

let beginRoundRepairs=0
arena=arena.replace(/canBegin && passToPlayer === null && \(!activeOnlineMatch \|\| [^\n]+?\)/g,()=>{
  beginRoundRepairs+=1
  return 'canBegin && passToPlayer === null && (!activeOnlineMatch || localViewer === game.firstPlayer)'
})
if(beginRoundRepairs<2) throw new Error(`gameplay flow patch: expected 2 begin-round prompt gates, repaired ${beginRoundRepairs}`)

fs.writeFileSync(enginePath,engine)
fs.writeFileSync(arenaPath,arena)
console.log('Repaired Kapores persistence, zero-target choice deadlocks, and authoritative Arena SET_VS/Effect/Attack/begin-round prompts')
