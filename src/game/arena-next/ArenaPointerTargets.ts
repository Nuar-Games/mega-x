import type { ArenaState } from './ArenaState'
import { deriveArenaCommandTargets } from './ArenaCommandSurface'
import { arenaActionPoint, arenaHandPoint, createArenaBoardLayout, type ArenaPrototypeLayout } from './prototype/ArenaPrototypeLayout'

export type ArenaPointerTarget = {
  key:string
  kind:'HAND_CARD'|'TIE_CARD'|'BOARD_CARD'|'SELF_DISCARD_CARD'|'ACTION'
  action:string
  label:string
  x:number
  y:number
  cardId?:number
  position?:'ATK'|'DEF'
  slot?:number
}

function boardPoint(state:ArenaState,cardId:number,layout:ArenaPrototypeLayout){
  if(state.pendingChoice?.kind!=='BOARD')return null
  const player=state.pendingChoice.value.target
  if(state.players[player].vs?.card.id===cardId)return layout.vs[player]
  const effectIndex=state.players[player].effects.findIndex(effect=>effect?.card.id===cardId)
  return effectIndex>=0?(layout.effectSlots[player][effectIndex]??null):null
}

/**
 * Coordinates are CSS-pixel coordinates inside the full-screen Phaser canvas.
 * The same viewer-relative layout drives both visible rendering and these
 * targets so player 0/player 1 ownership never changes screen geometry.
 */
export function deriveArenaPointerTargets(state:ArenaState,width:number,height:number):ArenaPointerTarget[]{
  if(state.phase==='GAME_OVER'||state.connection.networkBusy)return []
  const local=state.identity.localPlayerIndex
  const layout=createArenaBoardLayout(width,height,local)
  const targets=deriveArenaCommandTargets(state)
  const actionTargets=targets.filter(target=>target.kind==='ACTION')
  const hand=state.players[local].hand??[]
  const tieHand=state.pendingChoice?.kind==='TIE'?state.pendingChoice.value.hand:[]
  const output:ArenaPointerTarget[]=[]

  for(const target of targets){
    if(target.kind==='HAND_CARD'){
      const cardIndex=hand.findIndex(card=>card.id===target.cardId)
      if(cardIndex<0)continue
      const point=arenaHandPoint(cardIndex,Math.max(1,hand.length),layout)
      const setVsCommands=target.commands.filter(command=>command.action==='SET_VS')
      if(setVsCommands.length>0){
        setVsCommands.forEach((command,index)=>{
          output.push({
            key:`${target.key}:${command.position??index}`,
            kind:target.kind,
            action:command.action,
            label:`${target.label} ${command.position??''}`.trim(),
            x:point.x+(index-(setVsCommands.length-1)/2)*42,
            y:point.y-Math.max(58,layout.handBand.height*0.48),
            cardId:target.cardId,
            position:command.position,
          })
        })
        continue
      }
      const playEffect=target.commands.find(command=>command.action==='PLAY_EFFECT')
      if(playEffect){
        output.push({key:target.key,kind:target.kind,action:playEffect.action,label:target.label,x:point.x,y:point.y,cardId:target.cardId})
      }
      continue
    }

    if(target.kind==='TIE_CARD'){
      const cardIndex=tieHand.findIndex(card=>card.id===target.cardId)
      const command=target.commands.find(candidate=>candidate.action==='TIE_PICK')
      if(cardIndex<0||!command)continue
      const point=arenaHandPoint(cardIndex,Math.max(1,tieHand.length),layout)
      output.push({key:target.key,kind:target.kind,action:command.action,label:target.label,x:point.x,y:point.y,cardId:target.cardId})
      continue
    }

    if(target.kind==='BOARD_CARD'){
      if(target.cardId===undefined)continue
      const command=target.commands.find(candidate=>candidate.action==='RESOLVE_BOARD_CHOICE')
      const point=boardPoint(state,target.cardId,layout)
      if(!command||!point)continue
      output.push({key:target.key,kind:target.kind,action:command.action,label:target.label,x:point.x,y:point.y,cardId:target.cardId})
      continue
    }

    if(target.kind==='SELF_DISCARD_CARD'){
      if(target.cardId===undefined)continue
      const cardIndex=hand.findIndex(card=>card.id===target.cardId)
      if(cardIndex<0)continue
      const point=arenaHandPoint(cardIndex,Math.max(1,hand.length),layout)
      output.push({key:target.key,kind:target.kind,action:'SELECT_SELF_DISCARD',label:target.label,x:point.x,y:point.y,cardId:target.cardId})
      continue
    }

    const command=target.commands[0]
    if(!command)continue
    const actionIndex=actionTargets.indexOf(target)
    const point=arenaActionPoint(Math.max(0,actionIndex),Math.max(1,actionTargets.length),layout)
    output.push({
      key:target.key,
      kind:target.kind,
      action:command.action,
      label:target.label,
      x:point.x,
      y:point.y,
      cardId:command.cardId,
      position:command.position,
      slot:command.slot,
    })
  }

  return output
}
