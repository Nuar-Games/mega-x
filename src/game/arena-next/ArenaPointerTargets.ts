import type { ArenaState } from './ArenaState'
import { deriveArenaCommandTargets } from './ArenaCommandSurface'
import { createDesktopPrototypeLayout, type ArenaPrototypeLayout } from './prototype/ArenaPrototypeLayout'

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

function handPoint(index:number,count:number,layout:ArenaPrototypeLayout){
  const spacing=Math.min(118,layout.handBand.width/Math.max(1,count))
  return {x:layout.handBand.x+(index-(count-1)/2)*spacing,y:layout.handBand.y}
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
 * The browser E2E adds the canvas bounding-box origin before clicking, so the
 * test uses the same layout positions as the live arena instead of guessing.
 */
export function deriveArenaPointerTargets(state:ArenaState,width:number,height:number):ArenaPointerTarget[]{
  if(state.phase==='GAME_OVER'||state.connection.networkBusy)return []
  const layout=createDesktopPrototypeLayout(width,height)
  const targets=deriveArenaCommandTargets(state)
  const local=state.identity.localPlayerIndex
  const hand=state.players[local].hand??[]
  const tieHand=state.pendingChoice?.kind==='TIE'?state.pendingChoice.value.hand:[]
  const output:ArenaPointerTarget[]=[]
  let actionIndex=0

  for(const target of targets){
    if(target.kind==='HAND_CARD'){
      const cardIndex=hand.findIndex(card=>card.id===target.cardId)
      if(cardIndex<0)continue
      const point=handPoint(cardIndex,Math.max(1,hand.length),layout)
      const commands=target.commands.filter(command=>command.action==='SET_VS')
      commands.forEach((command,index)=>{
        output.push({
          key:`${target.key}:${command.position??index}`,
          kind:target.kind,
          action:command.action,
          label:`${target.label} ${command.position??''}`.trim(),
          x:point.x+(index-(commands.length-1)/2)*46,
          y:point.y+94,
          cardId:target.cardId,
          position:command.position,
        })
      })
      continue
    }

    if(target.kind==='TIE_CARD'){
      const cardIndex=tieHand.findIndex(card=>card.id===target.cardId)
      const command=target.commands.find(candidate=>candidate.action==='TIE_PICK')
      if(cardIndex<0||!command)continue
      const point=handPoint(cardIndex,Math.max(1,tieHand.length),layout)
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
      const point=handPoint(cardIndex,Math.max(1,hand.length),layout)
      output.push({key:target.key,kind:target.kind,action:'SELECT_SELF_DISCARD',label:target.label,x:point.x,y:point.y,cardId:target.cardId})
      continue
    }

    const command=target.commands[0]
    if(!command)continue
    const x=layout.viewport.width/2+(actionIndex-0.5)*118
    const y=layout.viewport.height*0.72
    actionIndex+=1
    output.push({
      key:target.key,
      kind:target.kind,
      action:command.action,
      label:target.label,
      x,y,
      cardId:command.cardId,
      position:command.position,
      slot:command.slot,
    })
  }

  return output
}
