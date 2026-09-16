export type ArenaCardAction={id:string;label:string}
export type ArenaCardRef={src:string;alt:string;actionId?:string;actions?:ArenaCardAction[]}
export type ArenaLegalAction={id:string;label:string;selector:string}
export type ArenaStats={atk:string;def:string;sta:string}
export type ArenaRenderState={
  playerName:string
  opponentName:string
  localSide:'left'|'right'
  localHand:ArenaCardRef[]
  opponentHandCount:number
  localVs:ArenaCardRef|null
  opponentVs:ArenaCardRef|null
  localStats:ArenaStats
  opponentStats:ArenaStats
  localPosition:string
  opponentPosition:string
  deckCount:number
  localZonXCount:number
  opponentZonXCount:number
  localDiscard:ArenaCardRef|null
  opponentDiscard:ArenaCardRef|null
  localZonX:ArenaCardRef|null
  opponentZonX:ArenaCardRef|null
  localEffects:ArenaCardRef[]
  opponentEffects:ArenaCardRef[]
  tieBreakerCards:ArenaCardRef[]
  tieBreakerReveal:ArenaCardRef[]
  tieBreakerMessage:string
  phase:string
  prompt:string
  timer:string
  status:string
  legalActions:ArenaLegalAction[]
  result:string|null
  connection:'online'|'practice'|'degraded'
}

type LeftOrRight='left'|'right'

const firstText=(root:ParentNode,selector:string)=>root.querySelector<HTMLElement>(selector)?.textContent?.trim()||''
const numberFromText=(value:string)=>Number(value.match(/\d+/)?.[0]||0)
const srcPath=(value:string)=>{
  try{return new URL(value,location.href).pathname}catch{return value}
}
const actionIdFor=(button:HTMLButtonElement,index:number)=>{
  if(button.dataset.arenaActionId)return button.dataset.arenaActionId
  const base=(button.dataset.arenaCardAction||button.className?.toString().trim()||'action').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'action'
  const cardId=button.closest<HTMLElement>('[data-arena-card-id]')?.dataset.arenaCardId
  const id=cardId?`${base}-card-${cardId}`:`${base}-${index}`
  button.dataset.arenaActionId=id
  return id
}
const mapCard=(img:HTMLImageElement):ArenaCardRef=>{
  const button=img.closest<HTMLButtonElement>('button[data-arena-action-id]')
  const slot=img.closest<HTMLElement>('[data-arena-card-id]')
  const actions=slot?Array.from(slot.querySelectorAll<HTMLButtonElement>('button[data-arena-card-action]')).filter(btn=>!btn.disabled).map((btn,index)=>({
    id:btn.dataset.arenaActionId||actionIdFor(btn,index),
    label:btn.dataset.arenaCardAction||btn.textContent?.trim()||'ACTION',
  })):[]
  return {
    src:srcPath(img.src),
    alt:img.alt||'',
    actionId:button?.dataset.arenaActionId,
    actions:actions.length?actions:undefined,
  }
}
const cardFrom=(root:ParentNode,selector:string):ArenaCardRef|null=>{
  const img=root.querySelector<HTMLImageElement>(selector)
  return img?.src?mapCard(img):null
}
const cardsFrom=(root:ParentNode,selector:string):ArenaCardRef[]=>Array.from(root.querySelectorAll<HTMLImageElement>(selector)).filter(img=>img.src).map(mapCard)
const statsFrom=(root:ParentNode,side:LeftOrRight):ArenaStats=>({
  atk:firstText(root,`.mx3-stats-${side} .mx3-atk strong`)||'—',
  def:firstText(root,`.mx3-stats-${side} .mx3-def strong`)||'—',
  sta:firstText(root,`.mx3-stats-${side} .mx3-sta strong`)||'—',
})
const positionFrom=(root:ParentNode,side:LeftOrRight)=>firstText(root,`.mx3-position-${side}`).replace(/^POSISI\s*/i,'').trim()||'—'

export function readArenaRenderState(shell:HTMLElement):ArenaRenderState{
  const allControls=Array.from(shell.querySelectorAll<HTMLButtonElement>('.mx3-phase-prompt button,.mx3-local-hand button,.mx3-position,.mx3-quit,.mx3-audio,.tie-breaker-choice-hand button,.board-target-card')).filter(btn=>!btn.disabled)
  allControls.forEach((button,index)=>actionIdFor(button,index))

  const boardTargets=Array.from(shell.querySelectorAll<HTMLButtonElement>('.board-target-card[data-arena-action-id]')).map(button=>{
    const img=button.querySelector<HTMLImageElement>('img')
    return img?{src:srcPath(img.src),alt:img.alt||'',actionId:button.dataset.arenaActionId}:null
  }).filter((target):target is {src:string;alt:string;actionId:string}=>Boolean(target?.actionId))
  const withBoardTarget=(card:ArenaCardRef|null):ArenaCardRef|null=>{
    if(!card)return null
    const target=boardTargets.find(item=>item.src===card.src||(item.alt&&card.alt&&item.alt===card.alt))
    return target?{...card,actionId:target.actionId}:card
  }
  const withBoardTargets=(cards:ArenaCardRef[])=>cards.map(card=>withBoardTarget(card) as ArenaCardRef)

  const leftFighter=shell.querySelector<HTMLElement>('.mx3-fighter-left')
  const rightFighter=shell.querySelector<HTMLElement>('.mx3-fighter-right')
  const localSide:LeftOrRight=leftFighter?.classList.contains('is-local')?'left':rightFighter?.classList.contains('is-local')?'right':'left'
  const opponentSide:LeftOrRight=localSide==='left'?'right':'left'
  const playerName=(localSide==='left'?leftFighter:rightFighter)?.querySelector('strong')?.textContent?.trim()||'X FIGHTER'
  const opponentName=(localSide==='left'?rightFighter:leftFighter)?.querySelector('strong')?.textContent?.trim()||'OPPONENT'
  const localHand=cardsFrom(shell,'.mx3-local-hand img').filter(card=>!card.src.includes('/back-game.webp'))
  const opponentHandCount=numberFromText(firstText(shell,'.mx3-opponent-hand .mx3-hand-label')) || shell.querySelectorAll('.mx3-opponent-hand .mx3-card-back').length
  const localVsSelector=localSide==='left'?'.mx3-vs-left img':'.mx3-vs-right img'
  const opponentVsSelector=localSide==='left'?'.mx3-vs-right img':'.mx3-vs-left img'
  const localXSelector=localSide==='left'?'.mx3-p1-x img':'.mx3-p2-x img'
  const opponentXSelector=localSide==='left'?'.mx3-p2-x img':'.mx3-p1-x img'
  const localXCountSelector=localSide==='left'?'.mx3-p1-counter':'.mx3-p2-counter'
  const opponentXCountSelector=localSide==='left'?'.mx3-p2-counter':'.mx3-p1-counter'
  const localDiscardSelector=localSide==='left'?'.mx3-p1-discard img':'.mx3-p2-discard img'
  const opponentDiscardSelector=localSide==='left'?'.mx3-p2-discard img':'.mx3-p1-discard img'
  const localEffectsSelector=localSide==='left'?'.mx3-effects-left img':'.mx3-effects-right img'
  const opponentEffectsSelector=localSide==='left'?'.mx3-effects-right img':'.mx3-effects-left img'

  const phaseClass=Array.from(shell.querySelector('.mx3-canvas')?.classList||[]).find(v=>v.startsWith('phase-'))
  const phase=(phaseClass?.slice(6)||firstText(shell,'.mx3-phase-prompt strong')||'WAIT').toUpperCase()
  const phaseControls=allControls.filter(button=>{
    if(button.closest('.mx3-local-hand')||button.closest('.tie-breaker-choice-hand')||button.matches('.board-target-card'))return false
    if(button.matches('.mx3-position')){
      const label=(button.textContent||'').replace(/\s+/g,' ').trim()
      const isLocalPosition=button.classList.contains(`mx3-position-${localSide}`)
      if(!isLocalPosition||phase==='SET_VS'||/^POSISI\s*[—-]?$/i.test(label))return false
    }
    return true
  })
  const legalActions=phaseControls.map((button,index)=>{
    const id=button.dataset.arenaActionId||actionIdFor(button,index)
    return {id,label:button.textContent?.trim()||'ACTION',selector:`[data-arena-action-id="${id}"]`}
  })

  const resultEl=shell.querySelector<HTMLElement>('.mx3-result,.result-screen,[data-match-result]')
  const status=firstText(shell,'.mx3-status')
  const degraded=/connection|reconnect|offline|network/i.test(status)
  const practice=/beginner bot|practice/i.test(shell.textContent||'')
  return {
    playerName,
    opponentName,
    localSide,
    localHand,
    opponentHandCount,
    localVs:withBoardTarget(cardFrom(shell,localVsSelector)),
    opponentVs:withBoardTarget(cardFrom(shell,opponentVsSelector)),
    localStats:statsFrom(shell,localSide),
    opponentStats:statsFrom(shell,opponentSide),
    localPosition:positionFrom(shell,localSide),
    opponentPosition:positionFrom(shell,opponentSide),
    deckCount:numberFromText(firstText(shell,'.mx3-master-counter')),
    localZonXCount:numberFromText(firstText(shell,localXCountSelector)),
    opponentZonXCount:numberFromText(firstText(shell,opponentXCountSelector)),
    localDiscard:cardFrom(shell,localDiscardSelector),
    opponentDiscard:cardFrom(shell,opponentDiscardSelector),
    localZonX:cardFrom(shell,localXSelector),
    opponentZonX:cardFrom(shell,opponentXSelector),
    localEffects:withBoardTargets(cardsFrom(shell,localEffectsSelector)),
    opponentEffects:withBoardTargets(cardsFrom(shell,opponentEffectsSelector)),
    tieBreakerCards:cardsFrom(shell,'.tie-breaker-choice-hand img'),
    tieBreakerReveal:cardsFrom(shell,'.tie-breaker-last-reveal img,.tie-breaker-pair img'),
    tieBreakerMessage:firstText(shell,'.tie-breaker-choice-copy em')||firstText(shell,'.tie-breaker-tied')||'',
    phase,
    prompt:firstText(shell,'.mx3-phase-prompt strong'),
    timer:firstText(shell,'.mx3-timer strong')||'—',
    status,
    legalActions,
    result:resultEl?.textContent?.trim()||null,
    connection:degraded?'degraded':practice?'practice':'online',
  }
}
