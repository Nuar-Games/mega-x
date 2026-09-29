import { useEffect, useRef, useState } from 'react'
import type { ArenaCardState, ArenaLegalCommand } from './ArenaState'

export type ArenaInspectSource='HAND'|'VS'|'EFFECT'|'ZON_X'|'ZON_TEPI'
export type ArenaInspectSelection={
  owner:0|1
  source:ArenaInspectSource
  cards:ArenaCardState[]
  index:number
}

type ArenaCardInspectProps={
  selection:ArenaInspectSelection
  localPlayerIndex:0|1
  legalCommands:ArenaLegalCommand[]
  timerSeconds:number
  hoverOnly?:boolean
  onIndex:(index:number)=>void
  onClose:()=>void
  onPlay:(command:ArenaLegalCommand)=>void
}

const inspectSrc=(cardId:number)=>`/cards/inspect/${String(cardId).padStart(2,'0')}.webp`

function sourceLabel(selection:ArenaInspectSelection){
  const current=selection.index+1
  const total=selection.cards.length
  if(selection.source==='HAND')return `KAD DI TANGAN · ${current} / ${total}`
  if(selection.source==='ZON_X')return `ZON X · ${current} / ${total}`
  if(selection.source==='ZON_TEPI')return `ZON TEPI · ${current} / ${total}`
  if(selection.source==='VS')return 'KAD VS'
  return 'KAD EFFECT'
}

export function ArenaCardInspect({selection,localPlayerIndex,legalCommands,timerSeconds,hoverOnly=false,onIndex,onClose,onPlay}:ArenaCardInspectProps){
  const [choosePosition,setChoosePosition]=useState(false)
  const touchStartX=useRef<number|null>(null)
  const card=selection.cards[selection.index]??selection.cards[0]
  const own=selection.owner===localPlayerIndex
  const border=own?'#268cff':'#ff3d45'
  const canNavigate=selection.cards.length>1
  const playable=selection.source==='HAND'&&own&&legalCommands.length>0&&!hoverOnly

  useEffect(()=>setChoosePosition(false),[card?.id,selection.source])
  if(!card)return null

  const move=(direction:-1|1)=>{
    if(!canNavigate)return
    const total=selection.cards.length
    onIndex((selection.index+direction+total)%total)
  }

  const play=()=>{
    if(legalCommands.length===1){onPlay(legalCommands[0]);return}
    setChoosePosition(true)
  }

  const cardImage=<img
    src={inspectSrc(card.id)}
    alt={card.name}
    data-arena-inspect-card="true"
    style={{display:'block',width:'min(70vw,360px)',maxHeight:'62dvh',objectFit:'contain',border:`3px solid ${border}`,borderRadius:16,boxShadow:`0 0 28px ${own?'rgba(38,140,255,.42)':'rgba(255,61,69,.42)'}`}}
  />

  if(hoverOnly)return <div data-arena-inspect-hover="true" style={{position:'fixed',inset:0,zIndex:55,pointerEvents:'none',display:'grid',placeItems:'center'}}>{cardImage}</div>

  return <div
    data-arena-inspect="true"
    onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose()}}
    onTouchStart={(event)=>{touchStartX.current=event.touches[0]?.clientX??null}}
    onTouchEnd={(event)=>{
      if(touchStartX.current===null)return
      const end=event.changedTouches[0]?.clientX??touchStartX.current
      const delta=end-touchStartX.current
      touchStartX.current=null
      if(Math.abs(delta)>36)move(delta>0?-1:1)
    }}
    style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'22px 14px',background:'rgba(2,5,12,.72)',backdropFilter:'blur(7px)',WebkitBackdropFilter:'blur(7px)',color:'#fff'}}
  >
    <section style={{width:'min(94vw,460px)',display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
      <header style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',font:'800 13px/1.1 system-ui',letterSpacing:'.12em'}}>
        <span style={{padding:'10px 14px',border:'1px solid rgba(255,214,72,.55)',borderRadius:999,background:'rgba(14,18,30,.9)',color:'#ffd448'}}>{sourceLabel(selection)}</span>
        <span data-arena-inspect-timer="true" style={{padding:'10px 14px',border:'1px solid rgba(255,214,72,.7)',borderRadius:999,background:'rgba(14,18,30,.92)',color:'#fff',font:'900 13px/1 "Barlow Condensed",system-ui',letterSpacing:'.08em'}}>{Math.max(0,timerSeconds)} SAAT</span>
      </header>

      <div style={{display:'grid',gridTemplateColumns:'46px 1fr 46px',alignItems:'center',gap:8}}>
        <button type="button" aria-label="Kad sebelumnya" onClick={()=>move(-1)} disabled={!canNavigate} style={{width:46,height:46,borderRadius:999,border:'1px solid #53627a',background:'#101729',color:'#fff',fontSize:28,opacity:canNavigate?1:.35}}>‹</button>
        {cardImage}
        <button type="button" aria-label="Kad seterusnya" onClick={()=>move(1)} disabled={!canNavigate} style={{width:46,height:46,borderRadius:999,border:'1px solid #53627a',background:'#101729',color:'#fff',fontSize:28,opacity:canNavigate?1:.35}}>›</button>
      </div>

      {canNavigate&&<div aria-label="Card carousel position" style={{display:'flex',gap:7}}>{selection.cards.map((_,index)=><span key={index} style={{width:index===selection.index?24:8,height:8,borderRadius:999,background:index===selection.index?'#ffd448':'#53627a'}}/>)}</div>}
      {canNavigate&&<div style={{font:'500 13px/1.2 system-ui',color:'#aeb8ca'}}>Leret kiri atau kanan untuk kad lain</div>}

      {playable&&<>
        <button type="button" data-arena-inspect-play="true" onClick={play} style={{width:'82%',minHeight:58,borderRadius:12,border:'1px solid #ffb33d',background:'linear-gradient(#ff302b,#d20f16)',color:'#fff',font:'900 18px/1 system-ui',letterSpacing:'.08em'}}>MAIN KAD INI</button>
        {choosePosition&&legalCommands.length>1&&<div style={{display:'flex',gap:10,width:'82%'}}>{legalCommands.map((command,index)=><button key={`${command.action}:${command.position??index}`} type="button" onClick={()=>onPlay(command)} style={{flex:1,minHeight:44,borderRadius:10,border:`1px solid ${border}`,background:'#101729',color:'#fff',font:'800 14px system-ui'}}>{command.position??command.action.replaceAll('_',' ')}</button>)}</div>}
      </>}

      <button type="button" data-arena-inspect-close="true" onClick={onClose} style={{width:'82%',minHeight:52,borderRadius:10,border:'1px solid #53627a',background:'#0c1221',color:'#fff',font:'800 16px/1 system-ui',letterSpacing:'.08em'}}>TUTUP</button>
      <div style={{font:'500 12px system-ui',color:'#8793a8'}}>Tekan di luar kad untuk tutup</div>
    </section>
  </div>
}
