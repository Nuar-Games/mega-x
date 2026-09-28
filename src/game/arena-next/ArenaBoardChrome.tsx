import type { CSSProperties } from 'react'
import type { ArenaState } from './ArenaState'
import type { ArenaPrototypeLayout } from './prototype/ArenaPrototypeLayout'
import './ArenaBoardChrome.css'

const BACK_SRC='/cards/back-game.webp'

type ArenaBoardChromeProps={
  state:ArenaState
  layout:ArenaPrototypeLayout
  timerSeconds:number
  timerProgress:number
}

function statValue(value:number|undefined){return Number.isFinite(value)?String(value):'—'}

function phaseLabel(state:ArenaState){
  if(state.phase==='SET_VS')return 'FASA KAD VS'
  if(state.phase==='EFFECT')return 'FASA EFFECT'
  if(state.phase==='ATTACK')return 'FASA SERANGAN'
  if(state.phase==='TIE_BREAKER')return 'PECAH SERI'
  return 'TAMAT'
}

function actionLabel(state:ArenaState){
  const actions=new Set(state.legalCommands.map(command=>command.action))
  if(actions.has('END_EFFECT_TURN'))return 'TAMAT TANPA EFFECT'
  if(actions.has('ATTACK'))return 'SERANG'
  if(actions.has('PASS_ATTACK'))return 'TAMAT TANPA SERANGAN'
  if(actions.has('SWITCH_POSITION'))return 'TUKAR POSISI'
  if(actions.has('RESOLVE_SELF_DISCARD'))return 'SAHKAN BUANGAN'
  if(actions.has('BEGIN_ROUND'))return 'MULA PUSINGAN'
  if(state.phase==='SET_VS')return 'PILIH KAD VS'
  if(state.phase==='EFFECT')return 'PILIH EFFECT'
  return 'TERUSKAN'
}

function activePlayer(state:ArenaState){
  return state.effectTurnIndex??state.attackTurnIndex??state.firstPlayerIndex
}

function PositionStats({state,player,own}:{state:ArenaState;player:0|1;own:boolean}){
  const stats=state.players[player].stats
  const position=state.players[player].vs?.position??'—'
  return <div className={`mx-arena-stats ${own?'is-own':'is-opponent'}`} data-board-element={own?'local-stats':'opponent-stats'}>
    {own&&<div className="mx-arena-position">POSISI {position}</div>}
    <div className="mx-arena-stat"><span>ATK</span><strong>{statValue(stats?.atk)}</strong></div>
    <div className="mx-arena-stat"><span>DEF</span><strong>{statValue(stats?.def)}</strong></div>
    <div className="mx-arena-stat"><span>STA</span><strong>{statValue(stats?.sta)}</strong></div>
    {!own&&<div className="mx-arena-position">POSISI {position}</div>}
  </div>
}

function VsCard({state,player,own}:{state:ArenaState;player:0|1;own:boolean}){
  const vs=state.players[player].vs
  return <div className={`mx-arena-vs ${own?'is-own':'is-opponent'}`} data-board-element={own?'local-vs':'opponent-vs'}>
    <div className="mx-arena-vs-tag">{own?'KAD KAMU':'KAD LAWAN'}</div>
    {vs?<img src={vs.card.artSrc} alt={vs.card.name} draggable={false}/>:<div className="mx-arena-card-empty">KAD VS</div>}
  </div>
}

function CardHint({state,player,own}:{state:ArenaState;player:0|1;own:boolean}){
  const card=state.players[player].vs?.card
  return <div className={`mx-arena-card-hint ${own?'is-own':'is-opponent'}`} data-board-element={own?'local-card-hint':'opponent-card-hint'}>
    <strong>{card?.name??'KAD VS'}</strong>
    <span>Tap kad untuk baca effect penuh</span>
  </div>
}

function EffectRow({state,player,own}:{state:ArenaState;player:0|1;own:boolean}){
  const effects=state.players[player].effects
  return <div className={`mx-arena-effect-row ${own?'is-own':'is-opponent'}`} data-board-element={own?'local-effect-row':'opponent-effect-row'}>
    {effects.map((effect,index)=><div key={index} className={`mx-arena-effect-slot ${effect?'has-card':''}`}>
      {effect?<img src={effect.card.artSrc} alt={effect.card.name} draggable={false}/>:<span>{index+1}</span>}
    </div>)}
    <div className="mx-arena-side-zone">
      <strong>{state.players[player].zonTepi.length}</strong>
      <span>ZON<br/>TEPI</span>
    </div>
  </div>
}

function FighterHeader({state,player,own}:{state:ArenaState;player:0|1;own:boolean}){
  const handCount=state.players[player].handCount
  const backCount=Math.min(4,handCount)
  if(own){
    return <div className="mx-arena-player-header" data-board-element="local-header">
      <div className="mx-arena-zon-x is-own"><strong>{state.players[player].zonX.length}</strong><span>ZON X</span></div>
      <div className="mx-arena-name-block"><span>KAMU · #{state.players[player].startRank??'—'}</span><strong>{state.players[player].handle}</strong></div>
      <div className="mx-arena-action">{actionLabel(state)}</div>
    </div>
  }
  return <div className="mx-arena-opponent-header" data-board-element="opponent-header">
    <div className="mx-arena-zon-x is-opponent"><strong>{state.players[player].zonX.length}</strong><span>ZON X</span></div>
    <div className="mx-arena-name-block"><span>LAWAN</span><strong>{state.players[player].handle}</strong></div>
    <div className="mx-arena-opponent-hand">
      <div className="mx-arena-hand-backs">{Array.from({length:backCount},(_,index)=><img key={index} src={BACK_SRC} alt="" draggable={false}/>)}</div>
      <strong>{handCount}</strong>
    </div>
    <div className="mx-arena-menu" aria-hidden="true"><i/><i/><i/></div>
  </div>
}

function HandFan({state,player}:{state:ArenaState;player:0|1}){
  const hand=state.players[player].hand??[]
  const count=Math.max(1,hand.length)
  return <div className="mx-arena-hand-zone" data-board-element="hand-zone">
    <div className="mx-arena-hand-label">KAD DI TANGAN · {hand.length}</div>
    <div className="mx-arena-hand-fan">
      {hand.map((card,index)=>{
        const offset=index-(count-1)/2
        const rotate=offset*4.5
        const y=Math.abs(offset)*5-(Math.abs(offset)<0.2?12:0)
        const style={'--mx-hand-rotate':`${rotate}deg`,'--mx-hand-y':`${y}px`,'--mx-hand-z':String(index+1)} as CSSProperties
        return <img key={card.id} src={card.artSrc} alt={card.name} draggable={false} style={style}/>
      })}
    </div>
  </div>
}

export function ArenaBoardChrome({state,layout,timerSeconds,timerProgress}:ArenaBoardChromeProps){
  const local=state.identity.localPlayerIndex
  const opponent=(local===0?1:0) as 0|1
  const active=activePlayer(state)
  const ownTurn=active===local
  const boardStyle={
    left:layout.board.x,
    top:layout.board.y,
    transform:`translate(-50%,-50%) scale(${layout.scale})`,
  } as CSSProperties
  const timerStyle={'--mx-timer-progress':`${Math.max(0,Math.min(1,timerProgress))*360}deg`} as CSSProperties

  return <div className="mx-arena-board" style={boardStyle} data-arena-chrome="true">
    <img className="mx-arena-background" src="/ui/landing/main-background.webp" alt="" draggable={false}/>
    <div className="mx-arena-tint-red"/>
    <div className="mx-arena-tint-blue"/>
    <div className="mx-arena-vignette"/>
    <div className="mx-arena-beam"/>
    <div className="mx-arena-spark spark-a"/><div className="mx-arena-spark spark-b"/><div className="mx-arena-spark spark-c"/><div className="mx-arena-spark spark-d"/><div className="mx-arena-spark spark-e"/><div className="mx-arena-spark spark-f"/>

    <FighterHeader state={state} player={opponent} own={false}/>
    <EffectRow state={state} player={opponent} own={false}/>
    <div className="mx-arena-effect-label is-opponent" data-board-element="opponent-effect-label">EFFECT LAWAN</div>

    <div className="mx-arena-centre-line"/><div className="mx-arena-centre-shimmer"/>
    <VsCard state={state} player={opponent} own={false}/>
    <PositionStats state={state} player={opponent} own={false}/>
    <CardHint state={state} player={opponent} own={false}/>

    <div className="mx-arena-master-deck" data-board-element="master-deck">
      <div className="mx-arena-deck-stack"><img src={BACK_SRC} alt="" draggable={false}/><img src={BACK_SRC} alt="Master Deck" draggable={false}/></div>
      <strong>{state.deckCount}</strong>
    </div>

    <div className={`mx-arena-turn ${ownTurn?'is-own':'is-opponent'}`} data-board-element="turn-indicator">
      <span>GILIRAN</span><strong>{ownTurn?'KAMU':'LAWAN'}</strong><small>{phaseLabel(state)}</small>
      <span className="mx-arena-turn-source">{ownTurn?'GILIRAN KAMU':'GILIRAN LAWAN'}</span>
    </div>

    <VsCard state={state} player={local} own/>
    <PositionStats state={state} player={local} own/>
    <CardHint state={state} player={local} own/>

    <div className="mx-arena-timer" data-board-element="timer" data-board-allow-overlap="timer" data-arena-timer="true" data-arena-timer-layer="70" data-arena-timer-seconds={timerSeconds} style={timerStyle}>
      <div className="mx-arena-timer-inner"><strong>{timerSeconds}</strong><span>SAAT</span></div>
    </div>

    <div className="mx-arena-effect-label is-own" data-board-element="local-effect-label">EFFECT KAMU</div>
    <EffectRow state={state} player={local} own/>
    <FighterHeader state={state} player={local} own/>
    <HandFan state={state} player={local}/>
  </div>
}
