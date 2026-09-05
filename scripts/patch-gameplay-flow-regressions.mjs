import fs from 'node:fs'

const enginePath='supabase/functions/match-action/engine.ts'
const arenaPath='src/arena-blueprint.fragment'
let engine=fs.readFileSync(enginePath,'utf8')
let arena=fs.readFileSync(arenaPath,'utf8')

const oldSta="const cap=effectCapacity(s,target);if(player(s,target).effects.length>cap)s.pendingBoardChoice={chooser:source,target,purpose:'STA_CAPACITY',title:`${label(source)}: STA berkurang — pilih kad Effect ${label(target)} untuk dibuang.`,cardIds:player(s,target).effects.map(e=>e.card)};else s.message=`${label(target)} STA VS berubah sebanyak ${delta}.`}"
const newSta="const cap=effectCapacity(s,target);if(source!==target&&player(s,target).effects.length>cap)s.pendingBoardChoice={chooser:source,target,purpose:'STA_CAPACITY',title:`${label(source)}: STA berkurang — pilih kad Effect ${label(target)} untuk dibuang.`,cardIds:player(s,target).effects.map(e=>e.card)};else s.message=`${label(target)} STA VS berubah sebanyak ${delta}.`}"
if(engine.includes(oldSta)) engine=engine.replace(oldSta,newSta)
else if(!engine.includes(newSta)) throw new Error('gameplay flow patch: modifySta semantics missing')

const oldHidden="function pendingHidden(s:EngineState,kind:PendingChoice['kind'],chooser:PlayerIndex,target:PlayerIndex,remaining:number,source:string){s.pendingChoice={kind,chooser,target,remaining,hiddenOrder:shuffle([...player(s,target).hand]),sourceCardName:source}}"
const newHidden="function pendingHidden(s:EngineState,kind:PendingChoice['kind'],chooser:PlayerIndex,target:PlayerIndex,remaining:number,source:string){if(remaining<=0){s.pendingChoice=null;return}s.pendingChoice={kind,chooser,target,remaining,hiddenOrder:shuffle([...player(s,target).hand]),sourceCardName:source}}"
if(engine.includes(oldHidden)) engine=engine.replace(oldHidden,newHidden)
else if(!engine.includes(newHidden)) throw new Error('gameplay flow patch: pendingHidden semantics missing')

for(const required of [
  'function destroyEffectTarget(',
  "if(p2Vs!==null)player(s,0).x.push(p2Vs)",
  "if(p1Vs!==null)player(s,1).x.push(p1Vs)",
  'function finishAtSafeDeckEndpoint(',
  'finishAtSafeDeckEndpoint(s,m)'
]) if(!engine.includes(required)) throw new Error(`gameplay flow patch: revised core rule missing: ${required}`)

const replacements=[
  ["(game.phase === 'SET_VS' && game.needsVS[bottomPlayer] && (activeOnlineMatch || setupPlayer === bottomPlayer))","(game.phase === 'SET_VS' && game.needsVS[activeOnlineMatch ? localViewer : bottomPlayer] && (activeOnlineMatch || setupPlayer === bottomPlayer))"],
  ["(game.phase === 'EFFECT' && game.effectTurn === bottomPlayer)","(game.phase === 'EFFECT' && game.effectTurn !== null && (activeOnlineMatch ? activeOnlineMatch.state?.effectTurn === onlineSession?.userId : game.effectTurn === bottomPlayer))"],
  ["(game.phase === 'ATTACK' && game.attackTurn === bottomPlayer)","(game.phase === 'ATTACK' && game.attackTurn !== null && (activeOnlineMatch ? activeOnlineMatch.state?.attackTurn === onlineSession?.userId : game.attackTurn === bottomPlayer))"],
  ["{game.phase === 'EFFECT' && game.effectTurn === bottomPlayer && <button onClick={requestEndEffectTurn}","{game.phase === 'EFFECT' && game.effectTurn !== null && (activeOnlineMatch ? activeOnlineMatch.state?.effectTurn === onlineSession?.userId : game.effectTurn === bottomPlayer) && <button onClick={requestEndEffectTurn}"],
  ["{game.phase === 'ATTACK' && game.attackTurn === bottomPlayer && <>","{game.phase === 'ATTACK' && game.attackTurn !== null && (activeOnlineMatch ? activeOnlineMatch.state?.attackTurn === onlineSession?.userId : game.attackTurn === bottomPlayer) && <>"],
]
for(const [from,to] of replacements){if(arena.includes(from))arena=arena.replace(from,to);else if(!arena.includes(to))throw new Error(`gameplay flow patch: Arena prompt semantics missing: ${from}`)}

let beginRoundRepairs=0
arena=arena.replace(/canBegin && passToPlayer === null && \(!activeOnlineMatch \|\| [^\n]+?\)/g,()=>{
  beginRoundRepairs+=1
  return 'canBegin && passToPlayer === null && (!activeOnlineMatch || activeOnlineMatch.state?.firstPlayer === onlineSession?.userId)'
})
if(beginRoundRepairs<2&&!arena.includes("!activeOnlineMatch || activeOnlineMatch.state?.firstPlayer === onlineSession?.userId")) throw new Error(`gameplay flow patch: begin-round prompt semantics missing`)

fs.writeFileSync(enginePath,engine)
fs.writeFileSync(arenaPath,arena)
console.log('Verified gameplay flow, revised Zon X destruction scoring, safe deck exhaustion, and server-state UUID Arena prompts')
