import type { ArenaRenderState, ArenaCardRef } from '../arena/ArenaStateAdapter'
import type { Arena3DQualityName } from './Arena3DQuality'
import { getSavedSession } from '../../onlineAuth'

type Props={
  state:ArenaRenderState
  onAction:(id:string)=>void
  onCardSelect:(card:ArenaCardRef)=>void
  chooser:ArenaCardRef|null
  onCloseChooser:()=>void
  quality:Arena3DQualityName
  onQuality:(quality:Arena3DQualityName)=>void
}

export function Arena3DHUD({state,onAction,onCardSelect,chooser,onCloseChooser,quality,onQuality}:Props){
  const prompt=(state.prompt||state.status||state.phase||'BATTLE').trim()
  const commands=state.legalActions.filter(action=>!/audio/i.test(action.label)).slice(0,6)
  const session=getSavedSession()
  const isGuest=!session?.accessToken||session.accessToken==='practice-local'
  const openSignIn=()=>window.dispatchEvent(new CustomEvent('mega-x:open-sign-in'))
  const playAgainAsGuest=()=>window.dispatchEvent(new CustomEvent('mega-x:start-practice-match'))
  const fullscreen=async()=>{
    const root=document.querySelector<HTMLElement>('[data-arena-3d-root]')
    if(!root)return
    try{
      if(document.fullscreenElement)await document.exitFullscreen()
      else await root.requestFullscreen()
    }catch{}
  }
  const activateCard=(card:ArenaCardRef)=>{
    if(card.actionId){onAction(card.actionId);return}
    if(card.actions?.length)onCardSelect(card)
  }
  const discardSelectedCount=state.pendingSelfDiscard?.cards.filter(card=>card.selected).length||0
  return <div className="mx3d-hud">
    <div className="mx3d-meta">
      <button type="button" onClick={()=>{const quit=state.legalActions.find(action=>/quit/i.test(action.label));if(quit)onAction(quit.id)}}>QUIT</button>
      <button type="button" onClick={fullscreen} aria-label="Toggle fullscreen">⛶</button>
      <select aria-label="3D quality" value={quality} onChange={event=>onQuality(event.target.value as Arena3DQualityName)}>
        <option value="high">HIGH</option><option value="medium">MED</option><option value="low">LOW</option>
      </select>
      {isGuest?<button type="button" onClick={openSignIn} aria-label="Sign in to earn leaderboard points">SIGN IN</button>:null}
    </div>
    <div className="mx3d-topbar"><div className="mx3d-prompt">{prompt}</div></div>
    <div className="mx3d-commands">
      {commands.filter(action=>!/quit/i.test(action.label)).map(action=><button key={action.id} type="button" className="mx3d-command" onClick={()=>onAction(action.id)}>{action.label}</button>)}
    </div>
    <div className="mx3d-status">{state.playerName} · {state.phase.replaceAll('_',' ')} · {state.timer==='—'?'BATTLE':state.timer} · DECK {state.deckCount}</div>
    {state.localHand.length?<div className="mx3d-mobile-hand" aria-label="Your hand">
      {state.localHand.slice(-7).map((card,index)=>{
        const enabled=Boolean(card.actionId||card.actions?.length)
        return <button key={`${card.src}-${index}`} type="button" className="mx3d-mobile-card" disabled={!enabled} onClick={()=>activateCard(card)} aria-label={card.alt||`Card ${index+1}`}>
          <img src={card.src} alt="" draggable={false}/>
        </button>
      })}
    </div>:null}
    {state.pendingSelfDiscard?<div className="mx3d-chooser" data-pending-self-discard-3d>
      <strong>{state.pendingSelfDiscard.reason||'BUANG KAD'}</strong>
      <div className="mx3d-discard-copy">{state.pendingSelfDiscard.mode==='EXACT'?`PILIH ${state.pendingSelfDiscard.count} · ${discardSelectedCount}/${state.pendingSelfDiscard.count}`:`PILIH 0+ · ${discardSelectedCount} DIPILIH`}</div>
      {state.pendingSelfDiscard.cards.map((card,index)=><button key={card.actionId||`discard-${index}`} type="button" className={`mx3d-choice ${card.selected?'is-selected':''}`.trim()} disabled={!card.actionId} onClick={()=>{if(card.actionId)onAction(card.actionId)}}>{card.alt||`KAD ${index+1}`}{card.selected?' · DIPILIH':''}</button>)}
      <button type="button" className="mx3d-choice" disabled={state.pendingSelfDiscard.confirmDisabled||!state.pendingSelfDiscard.confirmActionId} onClick={()=>{if(state.pendingSelfDiscard?.confirmActionId)onAction(state.pendingSelfDiscard.confirmActionId)}}>SAHKAN BUANG</button>
      {!state.pendingSelfDiscard.cards.length?<div className="mx3d-choice-waiting">WAITING · {state.pendingSelfDiscard.reason||'SELF DISCARD'}</div>:null}
    </div>:state.pendingChoice?<div className="mx3d-chooser" data-pending-choice-3d>
      <strong>{state.pendingChoice.sourceCardName||state.pendingChoice.kind||'PILIH SASARAN'}</strong>
      {state.pendingChoice.visibleTargets.map((card,index)=><button key={card.actionId||`visible-${index}`} type="button" className="mx3d-choice" onClick={()=>{if(card.actionId)onAction(card.actionId)}}>{card.alt||`KAD ${index+1}`}</button>)}
      {state.pendingChoice.hiddenSlots.map((card,index)=><button key={card.actionId||`hidden-${index}`} type="button" className="mx3d-choice" onClick={()=>{if(card.actionId)onAction(card.actionId)}}>{`KAD ${index+1}`}</button>)}
      {!state.pendingChoice.visibleTargets.length&&!state.pendingChoice.hiddenSlots.length?<div className="mx3d-choice-waiting">WAITING · {state.pendingChoice.sourceCardName||state.pendingChoice.kind} · {state.pendingChoice.remaining} REMAINING</div>:null}
    </div>:chooser&&chooser.actions?.length?<div className="mx3d-chooser">
      <strong>CARD ACTION</strong>
      {chooser.actions.map(action=><button key={action.id} type="button" className="mx3d-choice" onClick={()=>{onAction(action.id);onCloseChooser()}}>{action.label}</button>)}
      <button type="button" className="mx3d-choice" onClick={onCloseChooser}>CLOSE</button>
    </div>:null}
    {isGuest&&state.result?<div className="mx3d-chooser" data-guest-result-reminder>
      <strong>MATCH COMPLETE</strong>
      <div>GUEST RESULT — LEADERBOARD POINTS WERE NOT RECORDED.</div>
      <div>SIGN IN TO EARN POINTS IN FUTURE MATCHES.</div>
      <button type="button" className="mx3d-choice" onClick={openSignIn}>SIGN IN</button>
      <button type="button" className="mx3d-choice" onClick={playAgainAsGuest}>PLAY AGAIN AS GUEST</button>
    </div>:null}
    <div className="mx3d-hint">3D ARENA</div>
  </div>
}
