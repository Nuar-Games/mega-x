import type { ArenaRenderState, ArenaCardRef } from '../arena/ArenaStateAdapter'

type Props={
  state:ArenaRenderState
  onAction:(id:string)=>void
  chooser:ArenaCardRef|null
  onCloseChooser:()=>void
}

export function Arena3DHUD({state,onAction,chooser,onCloseChooser}:Props){
  const prompt=(state.prompt||state.status||state.phase||'BATTLE').trim()
  const commands=state.legalActions.filter(action=>!/audio/i.test(action.label)).slice(0,6)
  const fullscreen=async()=>{
    const root=document.querySelector<HTMLElement>('[data-arena-3d-root]')
    if(!root)return
    try{
      if(document.fullscreenElement)await document.exitFullscreen()
      else await root.requestFullscreen()
    }catch{}
  }
  return <div className="mx3d-hud">
    <div className="mx3d-meta">
      <button type="button" onClick={()=>{const quit=state.legalActions.find(action=>/quit/i.test(action.label));if(quit)onAction(quit.id)}}>QUIT</button>
      <button type="button" onClick={fullscreen} aria-label="Toggle fullscreen">⛶</button>
    </div>
    <div className="mx3d-topbar"><div className="mx3d-prompt">{prompt}</div></div>
    <div className="mx3d-commands">
      {commands.filter(action=>!/quit/i.test(action.label)).map(action=><button key={action.id} type="button" className="mx3d-command" onClick={()=>onAction(action.id)}>{action.label}</button>)}
    </div>
    <div className="mx3d-status">{state.playerName} · {state.phase.replaceAll('_',' ')} · {state.timer==='—'?'BATTLE':state.timer} · DECK {state.deckCount}</div>
    {chooser&&chooser.actions?.length?<div className="mx3d-chooser">
      <strong>CARD ACTION</strong>
      {chooser.actions.map(action=><button key={action.id} type="button" className="mx3d-choice" onClick={()=>{onAction(action.id);onCloseChooser()}}>{action.label}</button>)}
      <button type="button" className="mx3d-choice" onClick={onCloseChooser}>CLOSE</button>
    </div>:null}
    <div className="mx3d-hint">3D ARENA · DEVELOPMENT OPT-IN</div>
  </div>
}
