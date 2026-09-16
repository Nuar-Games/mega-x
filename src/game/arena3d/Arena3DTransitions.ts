import type { ArenaRenderState } from '../arena/ArenaStateAdapter'

export type Arena3DTransitionKind='draw'|'set-vs'|'attack'|'discard'|'zon-x'|'effect'|'result'
export type Arena3DTransition={kind:Arena3DTransitionKind;side?:'local'|'opponent';key:string}

export function deriveArena3DTransitions(previous:ArenaRenderState|null,next:ArenaRenderState):Arena3DTransition[]{
  if(!previous)return []
  const events:Arena3DTransition[]=[]
  if(next.localHand.length>previous.localHand.length)events.push({kind:'draw',side:'local',key:`draw-${next.localHand.length}-${next.deckCount}`})
  if(next.localVs?.src!==previous.localVs?.src&&next.localVs)events.push({kind:'set-vs',side:'local',key:`set-vs-local-${next.localVs.src}`})
  if(next.opponentVs?.src!==previous.opponentVs?.src&&next.opponentVs)events.push({kind:'set-vs',side:'opponent',key:`set-vs-opponent-${next.opponentVs.src}`})
  if(next.phase.includes('ATTACK')&&!previous.phase.includes('ATTACK'))events.push({kind:'attack',key:`attack-${next.phase}-${next.timer}`})
  if(next.localDiscard?.src!==previous.localDiscard?.src&&next.localDiscard)events.push({kind:'discard',side:'local',key:`discard-${next.localDiscard.src}`})
  if(next.localZonX?.src!==previous.localZonX?.src&&next.localZonX)events.push({kind:'zon-x',side:'local',key:`zon-x-${next.localZonX.src}`})
  if(next.localEffects.length!==previous.localEffects.length)events.push({kind:'effect',side:'local',key:`effect-${next.localEffects.length}`})
  if(next.result&&!previous.result)events.push({kind:'result',key:`result-${next.result}`})
  return events
}
