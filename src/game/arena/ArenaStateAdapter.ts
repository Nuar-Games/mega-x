export type ArenaCardRef={src:string;alt:string}
export type ArenaLegalAction={id:string;label:string;selector:string}
export type ArenaRenderState={
  playerName:string
  opponentName:string
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
  const fighters=Array.from(shell.querySelectorAll<HTMLElement>('.mx3-fighter strong')).map(el=>el.textContent?.trim()||'')
  const localFighter=shell.querySelector<HTMLElement>('.mx3-fighter.is-local strong')?.textContent?.trim()||fighters[0]||'X FIGHTER'
  const opponentFighter=fighters.find(name=>name&&name!==localFighter)||fighters[1]||'OPPONENT'
  const promptRoot=shell.querySelector<HTMLElement>('.mx3-phase-prompt')
  const localHand=cardsFrom(shell,'.mx3-local-hand img').filter(card=>!card.src.includes('/back-game.webp'))
  const opponentHandCount=numberFromText(firstText(shell,'.mx3-opponent-hand .mx3-hand-label')) || shell.querySelectorAll('.mx3-opponent-hand .mx3-card-back').length
  const vs=Array.from(shell.querySelectorAll<HTMLElement>('.mx3-vs'))
  const localVsRoot=vs.find(el=>el.closest('.mx3-canvas')&&el.classList.contains('mx3-vs-left'))||vs[0]
  const opponentVsRoot=vs.find(el=>el!==localVsRoot)||vs[1]
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
    playerName:localFighter,
    opponentName:opponentFighter,
    localHand,
    opponentHandCount,
    localVs:localVsRoot?cardFrom(localVsRoot,'img'):null,
    opponentVs:opponentVsRoot?cardFrom(opponentVsRoot,'img'):null,
    deckCount:numberFromText(firstText(shell,'.mx3-master-counter')),
    localDiscard:cardFrom(shell,'.mx3-p1-discard img'),
    opponentDiscard:cardFrom(shell,'.mx3-p2-discard img'),
    localZonX:cardFrom(shell,'.mx3-p1-x img'),
    opponentZonX:cardFrom(shell,'.mx3-p2-x img'),
    localEffects:cardsFrom(shell,'.mx3-effects-left img'),
    opponentEffects:cardsFrom(shell,'.mx3-effects-right img'),
    phase,
    prompt:firstText(shell,'.mx3-phase-prompt strong'),
    timer:firstText(shell,'.mx3-timer strong')||'—',
    status,
    legalActions,
    result:resultEl?.textContent?.trim()||null,
    connection:degraded?'degraded':practice?'practice':'online',
  }
}
