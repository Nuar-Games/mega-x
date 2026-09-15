export type ArenaCardRef={src:string;alt:string}
export type ArenaLegalAction={id:string;label:string;selector:string}
export type ArenaRenderState={
  playerName:string
  opponentName:string
  localSide:'left'|'right'
  localHand:ArenaCardRef[]
  opponentHandCount:number
  localVs:ArenaCardRef|null
  opponentVs:ArenaCardRef|null
  deckCount:number
  localDiscard:ArenaCardRef|null
  opponentDiscard:ArenaCardRef|null
  localZonX:ArenaCardRef|null
  opponentZonX:ArenaCardRef|null
  localEffects:ArenaCardRef[]
  opponentEffects:ArenaCardRef[]
  phase:string
  prompt:string
  timer:string
  status:string
  legalActions:ArenaLegalAction[]
  result:string|null
  connection:'online'|'practice'|'degraded'
}

const firstText=(root:ParentNode,selector:string)=>root.querySelector<HTMLElement>(selector)?.textContent?.trim()||''
const cardFrom=(root:ParentNode,selector:string):ArenaCardRef|null=>{
  const img=root.querySelector<HTMLImageElement>(selector)
  return img?.src?{src:new URL(img.src,location.href).pathname,alt:img.alt||''}:null
}
const cardsFrom=(root:ParentNode,selector:string):ArenaCardRef[]=>Array.from(root.querySelectorAll<HTMLImageElement>(selector)).filter(img=>img.src).map(img=>({src:new URL(img.src,location.href).pathname,alt:img.alt||''}))
const numberFromText=(value:string)=>Number(value.match(/\d+/)?.[0]||0)

export function readArenaRenderState(shell:HTMLElement):ArenaRenderState{
  const leftFighter=shell.querySelector<HTMLElement>('.mx3-fighter-left')
  const rightFighter=shell.querySelector<HTMLElement>('.mx3-fighter-right')
  const localSide:leftOrRight = leftFighter?.classList.contains('is-local')?'left':rightFighter?.classList.contains('is-local')?'right':'left'
  const playerName=(localSide==='left'?leftFighter:rightFighter)?.querySelector('strong')?.textContent?.trim()||'X FIGHTER'
  const opponentName=(localSide==='left'?rightFighter:leftFighter)?.querySelector('strong')?.textContent?.trim()||'OPPONENT'
  const localHand=cardsFrom(shell,'.mx3-local-hand img').filter(card=>!card.src.includes('/back-game.webp'))
  const opponentHandCount=numberFromText(firstText(shell,'.mx3-opponent-hand .mx3-hand-label')) || shell.querySelectorAll('.mx3-opponent-hand .mx3-card-back').length
  const localVsSelector=localSide==='left'?'.mx3-vs-left img':'.mx3-vs-right img'
  const opponentVsSelector=localSide==='left'?'.mx3-vs-right img':'.mx3-vs-left img'
  const localXSelector=localSide==='left'?'.mx3-p1-x img':'.mx3-p2-x img'
  const opponentXSelector=localSide==='left'?'.mx3-p2-x img':'.mx3-p1-x img'
  const localDiscardSelector=localSide==='left'?'.mx3-p1-discard img':'.mx3-p2-discard img'
  const opponentDiscardSelector=localSide==='left'?'.mx3-p2-discard img':'.mx3-p1-discard img'
  const localEffectsSelector=localSide==='left'?'.mx3-effects-left img':'.mx3-effects-right img'
  const opponentEffectsSelector=localSide==='left'?'.mx3-effects-right img':'.mx3-effects-left img'
  const controls=Array.from(shell.querySelectorAll<HTMLButtonElement>('.mx3-phase-prompt button,.mx3-local-hand button,.mx3-position,.mx3-quit,.mx3-audio')).filter(btn=>!btn.disabled&&btn.offsetParent!==null)
  const legalActions=controls.map((button,index)=>{
    const actionId=button.className?.toString().trim().replace(/\s+/g,'-')||`action-${index}`
    return {id:actionId,label:button.textContent?.trim()||'ACTION',selector:`[data-arena-action-id="${actionId}"]`}
  })
  controls.forEach((button,index)=>{
    const actionId=button.className?.toString().trim().replace(/\s+/g,'-')||`action-${index}`
    button.dataset.arenaActionId=actionId
  })
  const phaseClass=Array.from(shell.querySelector('.mx3-canvas')?.classList||[]).find(v=>v.startsWith('phase-'))
  const phase=(phaseClass?.slice(6)||firstText(shell,'.mx3-phase-prompt strong')||'WAIT').toUpperCase()
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
    localVs:cardFrom(shell,localVsSelector),
    opponentVs:cardFrom(shell,opponentVsSelector),
    deckCount:numberFromText(firstText(shell,'.mx3-master-counter')),
    localDiscard:cardFrom(shell,localDiscardSelector),
    opponentDiscard:cardFrom(shell,opponentDiscardSelector),
    localZonX:cardFrom(shell,localXSelector),
    opponentZonX:cardFrom(shell,opponentXSelector),
    localEffects:cardsFrom(shell,localEffectsSelector),
    opponentEffects:cardsFrom(shell,opponentEffectsSelector),
    phase,
    prompt:firstText(shell,'.mx3-phase-prompt strong'),
    timer:firstText(shell,'.mx3-timer strong')||'—',
    status,
    legalActions,
    result:resultEl?.textContent?.trim()||null,
    connection:degraded?'degraded':practice?'practice':'online',
  }
}

type leftOrRight='left'|'right'
