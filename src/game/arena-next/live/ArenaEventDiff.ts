import type { ArenaEvent, ArenaEventEnvelope, ArenaZone } from '../ArenaEvents'
import type { ArenaCardState, ArenaState } from '../ArenaState'

type PlayerIndex=0|1
type Located={player:PlayerIndex;zone:ArenaZone;card:ArenaCardState}

function indexVisibleCards(state:ArenaState){
  const map=new Map<number,Located>()
  for(const player of [0,1] as const){
    const p=state.players[player]
    p.hand?.forEach((card)=>map.set(card.id,{player,zone:'HAND',card}))
    if(p.vs)map.set(p.vs.card.id,{player,zone:'VS',card:p.vs.card})
    p.effects.forEach((effect)=>{if(effect)map.set(effect.card.id,{player,zone:'EFFECT',card:effect.card})})
    p.zonTepi.forEach((card)=>map.set(card.id,{player,zone:'ZON_TEPI',card}))
    p.zonX.forEach((card)=>map.set(card.id,{player,zone:'ZON_X',card}))
  }
  return map
}

function sameStats(a:any,b:any){return a?.atk===b?.atk&&a?.def===b?.def&&a?.sta===b?.sta}

export function deriveArenaEvents(previous:ArenaState,next:ArenaState,startSequence=0):ArenaEventEnvelope[]{
  if(previous.identity.matchId!==next.identity.matchId||next.stateVersion<=previous.stateVersion){
    return [{matchId:next.identity.matchId,sequence:startSequence+1,fromVersion:previous.stateVersion,toVersion:next.stateVersion,event:{type:'STATE_RECONCILED',reason:'RECOVERY'}}]
  }

  const events:ArenaEvent[]=[]
  const before=indexVisibleCards(previous)
  const after=indexVisibleCards(next)

  for(const player of [0,1] as const){
    const beforePlayer=previous.players[player]
    const afterPlayer=next.players[player]
    const beforeVs=beforePlayer.vs
    const afterVs=afterPlayer.vs

    if((!beforeVs&&afterVs)||(beforeVs&&afterVs&&beforeVs.card.id!==afterVs.card.id)){
      events.push({type:'VS_SET',player,cardId:afterVs!.card.id,position:afterVs!.position})
    }else if(beforeVs&&afterVs&&beforeVs.position!==afterVs.position){
      events.push({type:'POSITION_CHANGED',player,from:beforeVs.position,to:afterVs.position})
    }

    const beforeEffectIds=new Set(beforePlayer.effects.flatMap((effect)=>effect?[effect.card.id]:[]))
    afterPlayer.effects.forEach((effect)=>{
      if(effect&&!beforeEffectIds.has(effect.card.id))events.push({type:'EFFECT_PLAYED',player,cardId:effect.card.id,effectSequence:effect.sequence})
    })

    const beforeX=new Set(beforePlayer.zonX.map((card)=>card.id))
    afterPlayer.zonX.forEach((card)=>{
      if(!beforeX.has(card.id)){
        const old=before.get(card.id)
        events.push({type:'CARD_CAPTURED',player,cardId:card.id,fromPlayer:old?.player??(player===0?1:0)})
      }
    })

    const beforeDiscard=new Set(beforePlayer.zonTepi.map((card)=>card.id))
    afterPlayer.zonTepi.forEach((card)=>{
      if(beforeDiscard.has(card.id))return
      const old=before.get(card.id)
      if(old?.zone==='HAND')events.push({type:'CARD_DISCARDED',player,cardId:card.id,count:1})
      else events.push({type:'CARD_DESTROYED',owner:player,cardId:card.id,from:old?.zone==='VS'?'VS':old?.zone==='EFFECT'?'EFFECT':'HAND',destination:'ZON_TEPI'})
    })

    if(!sameStats(beforePlayer.stats,afterPlayer.stats))events.push({type:'STAT_CHANGED',player,before:beforePlayer.stats,after:afterPlayer.stats})

    if(beforePlayer.hand&&afterPlayer.hand&&afterPlayer.handCount>beforePlayer.handCount){
      const previousIds=new Set(beforePlayer.hand.map((card)=>card.id))
      const drawn=afterPlayer.hand.filter((card)=>!previousIds.has(card.id))
      if(drawn.length)drawn.forEach((card)=>events.push({type:'CARD_DRAWN',player,cardId:card.id,count:1}))
      else events.push({type:'CARD_DRAWN',player,cardId:null,count:afterPlayer.handCount-beforePlayer.handCount})
    }else if(!afterPlayer.hand&&afterPlayer.handCount>beforePlayer.handCount){
      events.push({type:'CARD_DRAWN',player,cardId:null,count:afterPlayer.handCount-beforePlayer.handCount})
    }
  }

  for(const [id,old] of before){
    const current=after.get(id)
    if(!current||current.zone===old.zone&&current.player===old.player)continue
    const alreadyRepresented=events.some((event)=>
      ('cardId' in event&&event.cardId===id)&&['CARD_CAPTURED','CARD_DESTROYED','CARD_DISCARDED','VS_SET','EFFECT_PLAYED'].includes(event.type),
    )
    if(!alreadyRepresented)events.push({type:'CARD_MOVED',player:current.player,cardId:id,from:old.zone,to:current.zone})
  }

  if(previous.phase!==next.phase)events.push({type:'PHASE_CHANGED',from:previous.phase,to:next.phase})
  if(previous.effectTurnIndex!==next.effectTurnIndex||previous.attackTurnIndex!==next.attackTurnIndex){
    events.push({type:'TURN_CHANGED',effectTurn:next.effectTurnIndex,attackTurn:next.attackTurnIndex})
  }
  if(previous.winnerIndex!==next.winnerIndex&&next.phase==='GAME_OVER')events.push({type:'MATCH_ENDED',winner:next.winnerIndex})

  if(events.length===0)events.push({type:'STATE_RECONCILED',reason:'RECOVERY'})

  return events.map((event,index)=>({
    matchId:next.identity.matchId,
    sequence:startSequence+index+1,
    fromVersion:previous.stateVersion,
    toVersion:next.stateVersion,
    event,
  }))
}
