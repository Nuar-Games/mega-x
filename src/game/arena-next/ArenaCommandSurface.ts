import type { ArenaLegalCommand, ArenaState } from './ArenaState'

export type ArenaCommandTarget = {
  kind:'HAND_CARD'|'TIE_CARD'|'BOARD_CARD'|'SELF_DISCARD_CARD'|'ACTION'
  key:string
  cardId?:number
  label:string
  commands:ArenaLegalCommand[]
}

function cardLabel(state:ArenaState,cardId:number){
  for(const player of state.players){
    const cards=[...(player.hand??[]),...player.zonTepi,...player.zonX]
    if(player.vs)cards.push(player.vs.card)
    for(const effect of player.effects)if(effect)cards.push(effect.card)
    const found=cards.find(card=>card.id===cardId)
    if(found)return found.name
  }
  if(state.pendingChoice?.kind==='TIE'){
    const found=state.pendingChoice.value.hand.find(card=>card.id===cardId)
    if(found)return found.name
  }
  return `CARD ${cardId}`
}

export function deriveArenaCommandTargets(state:ArenaState):ArenaCommandTarget[]{
  const targets=new Map<string,ArenaCommandTarget>()

  for(const command of state.legalCommands){
    switch(command.action){
      case 'SET_VS': {
        if(command.cardId===undefined)break
        const key=`hand:${command.cardId}`
        const existing=targets.get(key)
        if(existing){
          existing.commands.push(command)
          break
        }
        targets.set(key,{
          kind:'HAND_CARD',
          key,
          cardId:command.cardId,
          label:cardLabel(state,command.cardId),
          commands:[command],
        })
        break
      }
      case 'TIE_PICK': {
        if(command.cardId===undefined)break
        const key=`tie:${command.cardId}`
        targets.set(key,{
          kind:'TIE_CARD',
          key,
          cardId:command.cardId,
          label:cardLabel(state,command.cardId),
          commands:[command],
        })
        break
      }
      case 'RESOLVE_BOARD_CHOICE': {
        if(command.cardId===undefined)break
        const key=`board:${command.cardId}`
        targets.set(key,{
          kind:'BOARD_CARD',
          key,
          cardId:command.cardId,
          label:cardLabel(state,command.cardId),
          commands:[command],
        })
        break
      }
      case 'RESOLVE_SELF_DISCARD': {
        const hand=state.players[state.identity.localPlayerIndex].hand??[]
        for(const card of hand){
          const key=`self-discard:${card.id}`
          targets.set(key,{
            kind:'SELF_DISCARD_CARD',
            key,
            cardId:card.id,
            label:card.name,
            commands:[command],
          })
        }
        targets.set('action:RESOLVE_SELF_DISCARD',{
          kind:'ACTION',
          key:'action:RESOLVE_SELF_DISCARD',
          label:'CONFIRM DISCARD',
          commands:[command],
        })
        break
      }
      case 'ATTACK':
      case 'PASS_ATTACK': {
        const key=`action:${command.action}`
        targets.set(key,{
          kind:'ACTION',
          key,
          label:command.action==='ATTACK'?'ATTACK':'PASS',
          commands:[command],
        })
        break
      }
      default:
        break
    }
  }

  return [...targets.values()]
}
