import type { ArenaLegalCommand, ArenaState } from './ArenaState'

export type ArenaCommandTarget = {
  kind:'HAND_CARD'|'ACTION'
  key:string
  cardId?:number
  label:string
  commands:ArenaLegalCommand[]
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
        const hand=state.players[state.identity.localPlayerIndex].hand??[]
        const card=hand.find(candidate=>candidate.id===command.cardId)
        targets.set(key,{
          kind:'HAND_CARD',
          key,
          cardId:command.cardId,
          label:card?.name??`CARD ${command.cardId}`,
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
