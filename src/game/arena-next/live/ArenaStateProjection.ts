import { CARD_INFO } from '../../../arena-card-info'
import type { ActiveOnlineMatch } from '../../../onlineAuth'
import type {
  ArenaBoardChoice,
  ArenaCardState,
  ArenaEffectSlots,
  ArenaEffectState,
  ArenaHiddenChoice,
  ArenaLegalCommand,
  ArenaPendingChoice,
  ArenaPlayerState,
  ArenaSelfDiscardChoice,
  ArenaState,
  ArenaStats,
  ArenaTieChoice,
  ArenaVsState,
} from '../ArenaState'

type PlayerIndex = 0 | 1

type RawEffect = { card?: unknown; seq?: unknown; spudurDiscardCount?: unknown; playedRound?: unknown }
type RawPlayer = {
  hand?: unknown[]
  handCount?: unknown
  vs?: any
  vsCommitted?: unknown
  effects?: RawEffect[]
  discard?: unknown[]
  x?: unknown[]
  attackBlocks?: unknown
}

const asIndex=(value:unknown,match:ActiveOnlineMatch):PlayerIndex|null=>{
  if(value===0||value==='0'||value===match.player1_id)return 0
  if(value===1||value==='1'||value===match.player2_id)return 1
  return null
}

const cardFromId=(value:unknown):ArenaCardState|null=>{
  const id=Number(value)
  const info=CARD_INFO[id]
  if(!Number.isFinite(id)||!info)return null
  return {
    id,
    name:info.name,
    artSrc:`/cards/game/${String(id).padStart(2,'0')}.webp`,
    baseAtk:info.atk,
    baseDef:info.def,
    baseSta:info.sta,
  }
}

const cardsFromIds=(values:unknown):ArenaCardState[]=>
  (Array.isArray(values)?values:[]).map(cardFromId).filter((card):card is ArenaCardState=>Boolean(card))

const effectFromRaw=(value:RawEffect,round:number):ArenaEffectState|null=>{
  const card=cardFromId(value?.card)
  if(!card)return null
  return {
    card,
    sequence:Number(value?.seq??0),
    spudurDiscardCount:Number(value?.spudurDiscardCount??0),
    playedRound:Number(value?.playedRound??round),
  }
}

const effectsFromRaw=(values:unknown,round:number):ArenaEffectState[]=>
  (Array.isArray(values)?values:[]).map((value)=>effectFromRaw(value as RawEffect,round)).filter((effect):effect is ArenaEffectState=>Boolean(effect))

const effectSlots=(effects:ArenaEffectState[]):ArenaEffectSlots=>[
  effects[0]??null,effects[1]??null,effects[2]??null,effects[3]??null,effects[4]??null,
]

const vsFromRaw=(raw:any):ArenaVsState|null=>{
  if(!raw||raw==='null')return null
  const card=cardFromId(raw.card)
  if(!card)return null
  return {
    card,
    position:raw.position==='DEF'?'DEF':'ATK',
    staDelta:Number(raw.staDelta??0),
    positionChangedThisRound:Boolean(raw.positionChangedThisRound),
    spudurDiscardCount:Number(raw.spudurDiscardCount??0),
  }
}

export function computeArenaStats(players:[ArenaPlayerState,ArenaPlayerState],player:PlayerIndex):ArenaStats|null{
  const vs=players[player].vs
  if(!vs)return null
  let atk=vs.card.baseAtk
  let def=vs.card.baseDef

  if(vs.card.id===26)atk+=vs.spudurDiscardCount*100

  const allEffects:Array<{owner:PlayerIndex;effect:ArenaEffectState}>=[]
  players[0].effects.forEach((effect)=>{if(effect)allEffects.push({owner:0,effect})})
  players[1].effects.forEach((effect)=>{if(effect)allEffects.push({owner:1,effect})})
  allEffects.sort((a,b)=>a.effect.sequence-b.effect.sequence)

  for(const {owner,effect} of allEffects){
    const id=effect.card.id
    if(owner===player){
      if(id===19)atk+=1000
      if(id===20)atk+=600
    }else{
      if(id===2)atk=0
      if(id===4)atk-=100
      if(id===12)atk-=200
      if(id===13)def-=200
      if(id===24)[atk,def]=[def,atk]
      if(id===26)atk-=effect.spudurDiscardCount*100
    }
  }

  if(vs.card.id===29&&players[player].effects.some((effect)=>effect?.card.name.includes('BARA')))atk*=2
  if(players[player===0?1:0].effects.some((effect)=>effect?.card.id===2))atk=0

  return {atk:Math.max(0,atk),def:Math.max(0,def),sta:Math.max(0,vs.card.baseSta+vs.staDelta)}
}

function projectPendingChoice(raw:any,match:ActiveOnlineMatch):ArenaPendingChoice|null{
  if(raw?.pendingSelfDiscard){
    const p=raw.pendingSelfDiscard
    const player=asIndex(p.player,match)
    if(player!==null){
      const value:ArenaSelfDiscardChoice={
        player,
        count:Number(p.count??0),
        mode:p.mode==='ANY'?'ANY':'EXACT',
        reason:['HAND_LIMIT','PIPIT','SPUDUR_VS','SPUDUR_EFFECT'].includes(p.reason)?p.reason:'HAND_LIMIT',
        sourceEffectSequence:p.sourceEffectSeq===undefined?undefined:Number(p.sourceEffectSeq),
      }
      return {kind:'SELF_DISCARD',value}
    }
  }
  if(raw?.pendingBoardChoice){
    const p=raw.pendingBoardChoice
    const chooser=asIndex(p.chooser,match)
    const target=asIndex(p.target,match)
    if(chooser!==null&&target!==null){
      const purpose=['DESTROY_ELIGIBLE','STA_CAPACITY','GERGASI_EFFECT','RETURN_EFFECT'].includes(p.purpose)?p.purpose:'DESTROY_ELIGIBLE'
      const value:ArenaBoardChoice={chooser,target,purpose,title:String(p.title??''),cardIds:Array.isArray(p.cardIds)?p.cardIds.map(Number):[]}
      return {kind:'BOARD',value}
    }
  }
  if(raw?.pendingChoice){
    const p=raw.pendingChoice
    const chooser=asIndex(p.chooser,match)
    const target=asIndex(p.target,match)
    if(chooser!==null&&target!==null){
      const value:ArenaHiddenChoice={
        kind:['ABNER','PELUNCUR','TOM','GERGASI'].includes(p.kind)?p.kind:'ABNER',
        chooser,target,
        remaining:Number(p.remaining??0),
        hiddenCount:Number(p.hiddenCount??0),
        sourceCardName:String(p.sourceCardName??p.kind??'EFFECT'),
      }
      return {kind:'HIDDEN',value}
    }
  }
  if(raw?.phase==='TIE_BREAKER'&&raw?.tieChoice){
    const p=raw.tieChoice
    const reveal=raw.tiePublic?.left&&raw.tiePublic?.right?{
      left:cardFromId(raw.tiePublic.left)!,
      right:cardFromId(raw.tiePublic.right)!,
      status:raw.tiePublic.status==='TIED'?'TIED' as const:'DECIDED' as const,
    }:null
    const value:ArenaTieChoice={
      hand:cardsFromIds(p.hand),
      picked:Boolean(p.picked),
      opponentPicked:Boolean(p.opponentPicked),
      pair:Math.max(1,Number(p.pair??1)),
      reveal,
    }
    return {kind:'TIE',value}
  }
  return null
}

function effectCapacity(players:[ArenaPlayerState,ArenaPlayerState],player:PlayerIndex,round:number){
  const stats=computeArenaStats(players,player)
  if(!stats)return 0
  let capacity=Math.min(5,Math.max(0,Math.min(stats.sta,6)-1))
  const opponent=player===0?1:0
  if(players[opponent].effects.some((effect)=>effect?.card.id===14))capacity=Math.min(capacity,2)
  if(players[opponent].effects.some((effect)=>effect?.card.id===18&&effect.playedRound===round))capacity=Math.min(capacity,2)
  return capacity
}

function legalCommandsFor(state:Omit<ArenaState,'legalCommands'>,raw:any,match:ActiveOnlineMatch):ArenaLegalCommand[]{
  if(match.status!=='ACTIVE')return []
  const me=state.identity.localPlayerIndex
  const mine=state.players[me]
  const opponent=me===0?1:0
  const pending=state.pendingChoice
  const commands:ArenaLegalCommand[]=[]

  if(pending){
    if(pending.kind==='SELF_DISCARD'&&pending.value.player===me)commands.push({action:'RESOLVE_SELF_DISCARD'})
    if(pending.kind==='BOARD'&&pending.value.chooser===me)pending.value.cardIds.forEach((cardId)=>commands.push({action:'RESOLVE_BOARD_CHOICE',cardId}))
    if(pending.kind==='HIDDEN'&&pending.value.chooser===me){
      Array.from({length:pending.value.hiddenCount},(_,slot)=>commands.push({action:'RESOLVE_HIDDEN_CHOICE',slot}))
      if(pending.value.kind==='PELUNCUR')state.players[pending.value.target].effects.forEach((effect)=>{if(effect)commands.push({action:'RESOLVE_VISIBLE_EFFECT_CHOICE',cardId:effect.card.id})})
    }
    if(pending.kind==='TIE'&&!pending.value.picked)pending.value.hand.forEach((card)=>commands.push({action:'TIE_PICK',cardId:card.id}))
    return commands
  }

  if(state.phase==='SET_VS'&&state.needsVS[me]&&mine.hand){
    mine.hand.forEach((card)=>{
      commands.push({action:'SET_VS',cardId:card.id,position:'ATK'})
      commands.push({action:'SET_VS',cardId:card.id,position:'DEF'})
    })
    return commands
  }
  if(state.phase==='SET_VS'&&state.firstPlayerIndex===me&&!state.needsVS[0]&&!state.needsVS[1]&&state.players[0].vs&&state.players[1].vs){
    commands.push({action:'BEGIN_ROUND'})
    return commands
  }
  if(state.phase==='EFFECT'&&state.effectTurnIndex===me){
    const rawTaken=Boolean(raw?.effectActionTaken?.[me])
    const positionLocked=state.round===1||mine.vs?.positionChangedThisRound||rawTaken||state.players[opponent].effects.some((effect)=>effect?.card.id===6)
    if(mine.vs&&!positionLocked)commands.push({action:'SWITCH_POSITION'})
    if(mine.hand&&mine.effects.filter(Boolean).length<effectCapacity(state.players,me,state.round))mine.hand.forEach((card)=>commands.push({action:'PLAY_EFFECT',cardId:card.id}))
    commands.push({action:'END_EFFECT_TURN'})
    return commands
  }
  if(state.phase==='ATTACK'&&state.attackTurnIndex===me){
    if(mine.vs?.position==='ATK')commands.push({action:'ATTACK'})
    commands.push({action:'PASS_ATTACK'})
  }
  return commands
}

export function projectActiveMatchToArenaState(match:ActiveOnlineMatch,viewerId:string):ArenaState{
  const raw=match.state??{}
  const localPlayerIndex:PlayerIndex=match.player1_id===viewerId?0:1
  const round=Number(raw.round??1)
  const rawPlayers:[RawPlayer,RawPlayer]=[raw.player1??{},raw.player2??{}]
  const players=rawPlayers.map((p,index)=>{
    const isLocal=index===localPlayerIndex
    const visibleHand=cardsFromIds(p.hand)
    const projected:ArenaPlayerState={
      playerId:index===0?match.player1_id:match.player2_id,
      handle:index===0?match.player1_handle:match.player2_handle,
      startRank:index===0?(match.player1_start_place??null):(match.player2_start_place??null),
      hand:isLocal ? visibleHand : null,
      handCount:isLocal?visibleHand.length:Number(p.handCount??visibleHand.length??0),
      vs:vsFromRaw(p.vs),
      effects:effectSlots(effectsFromRaw(p.effects,round)),
      zonTepi:cardsFromIds(p.discard),
      zonX:cardsFromIds(p.x),
      capturedCount:cardsFromIds(p.x).length,
      stats:null,
      attackBlocks:Number(p.attackBlocks??0),
    }
    return projected
  }) as [ArenaPlayerState,ArenaPlayerState]
  players[0].stats=computeArenaStats(players,0)
  players[1].stats=computeArenaStats(players,1)

  const firstPlayerIndex=asIndex(raw.firstPlayer,match)??0
  const effectTurnIndex=asIndex(raw.effectTurn,match)
  const attackTurnIndex=asIndex(raw.attackTurn,match)
  const winnerIndex=asIndex(raw.winner,match)
  const phase=['SET_VS','EFFECT','ATTACK','TIE_BREAKER','GAME_OVER'].includes(raw.phase)?raw.phase:'SET_VS'
  const pendingChoice=projectPendingChoice(raw,match)
  const base:Omit<ArenaState,'legalCommands'>={
    schemaVersion:1,
    identity:{
      matchId:match.id,
      mode:match.id.startsWith('practice-local:')?'practice':'online',
      localPlayerIndex,
      players:[
        {playerId:match.player1_id,handle:match.player1_handle,startRank:match.player1_start_place??null},
        {playerId:match.player2_id,handle:match.player2_handle,startRank:match.player2_start_place??null},
      ],
    },
    stateVersion:Number(match.state_version),
    phase,
    round,
    firstPlayerIndex,
    effectTurnIndex,
    attackTurnIndex,
    needsVS:[Boolean(raw.needsVS?.[0]),Boolean(raw.needsVS?.[1])],
    deckCount:Number(raw.deckCount??(Array.isArray(raw.deck)?raw.deck.length:0)),
    players,
    pendingChoice,
    message:String(raw.message??''),
    winnerIndex,
    connection:{
      status:match.id.startsWith('practice-local:')?'practice':match.status==='PAUSED'?'paused':'online',
      disconnectedPlayerId:match.disconnected_player??null,
      reconnectDeadline:match.reconnect_deadline??null,
      networkBusy:false,
      lastError:null,
    },
  }
  return {...base,legalCommands:legalCommandsFor(base,raw,match)}
}
