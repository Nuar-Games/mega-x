import type { ArenaPhase, ArenaPosition, ArenaStats } from './ArenaState'

export type ArenaZone = 'HAND' | 'VS' | 'EFFECT' | 'ZON_TEPI' | 'ZON_X' | 'MASTER_DECK' | 'TIE_BREAKER'

export type ArenaEventType =
  | 'VS_SET'
  | 'CARD_DRAWN'
  | 'EFFECT_PLAYED'
  | 'EFFECT_TRIGGERED'
  | 'CARD_MOVED'
  | 'CARD_CAPTURED'
  | 'CARD_DESTROYED'
  | 'CARD_RETURNED_TO_DECK'
  | 'CARD_DISCARDED'
  | 'POSITION_CHANGED'
  | 'STAT_CHANGED'
  | 'ATTACK_DECLARED'
  | 'ATTACK_RESOLVED'
  | 'PHASE_CHANGED'
  | 'TURN_CHANGED'
  | 'TIE_BREAKER_REVEALED'
  | 'MATCH_ENDED'
  | 'STATE_RECONCILED'

export type ArenaEvent =
  | { type: 'VS_SET'; player: 0 | 1; cardId: number; position: ArenaPosition }
  | { type: 'CARD_DRAWN'; player: 0 | 1; cardId: number | null; count: number }
  | { type: 'EFFECT_PLAYED'; player: 0 | 1; cardId: number; effectSequence: number }
  | { type: 'EFFECT_TRIGGERED'; player: 0 | 1; cardId: number; targetPlayer: 0 | 1 | null }
  | { type: 'CARD_MOVED'; player: 0 | 1; cardId: number | null; from: ArenaZone; to: ArenaZone }
  | { type: 'CARD_CAPTURED'; player: 0 | 1; cardId: number; fromPlayer: 0 | 1 }
  | { type: 'CARD_DESTROYED'; owner: 0 | 1; cardId: number; from: 'VS' | 'EFFECT' | 'HAND'; destination: 'ZON_TEPI' | 'ZON_X' }
  | { type: 'CARD_RETURNED_TO_DECK'; owner: 0 | 1; cardId: number | null; count: number }
  | { type: 'CARD_DISCARDED'; player: 0 | 1; cardId: number | null; count: number }
  | { type: 'POSITION_CHANGED'; player: 0 | 1; from: ArenaPosition; to: ArenaPosition }
  | { type: 'STAT_CHANGED'; player: 0 | 1; before: ArenaStats | null; after: ArenaStats | null }
  | { type: 'ATTACK_DECLARED'; attacker: 0 | 1; defender: 0 | 1 }
  | { type: 'ATTACK_RESOLVED'; winner: 0 | 1 | null; loser: 0 | 1 | null; capturedCardId: number | null }
  | { type: 'PHASE_CHANGED'; from: ArenaPhase; to: ArenaPhase }
  | { type: 'TURN_CHANGED'; effectTurn: 0 | 1 | null; attackTurn: 0 | 1 | null }
  | { type: 'TIE_BREAKER_REVEALED'; leftCardId: number; rightCardId: number; status: 'TIED' | 'DECIDED' }
  | { type: 'MATCH_ENDED'; winner: 0 | 1 | null }
  | { type: 'STATE_RECONCILED'; reason: 'INITIAL_LOAD' | 'RECONNECT' | 'STALE_REFRESH' | 'RECOVERY' }

export type ArenaEventEnvelope = {
  matchId: string
  sequence: number
  fromVersion: number
  toVersion: number
  event: ArenaEvent
}
