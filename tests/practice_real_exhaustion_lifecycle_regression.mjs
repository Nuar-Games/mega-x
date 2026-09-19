import fs from 'node:fs'
import {
  startPracticeMatch,
  submitPracticeAction,
  tickPracticeBot,
} from '../src/practice-match.ts'

const HUMAN = 'practice-regression-human'
const STRESS_MATCHES = 1000
const STRESS_STEPS = 220
const SAFE_EFFECTS = new Set([1, 4, 5, 6, 8, 11, 12, 13, 14, 16, 17, 19, 20, 21, 24, 25, 27, 28, 29, 30])

function seededRandom(seed) {
  let value = seed >>> 0
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0
    return value / 0x100000000
  }
}

function isHumanOwner(value) {
  return value === 0 || value === HUMAN
}

function drivePracticeMatch(seed, options = {}) {
  const { exerciseEffects = true, forceAggressive = false, maxSteps = STRESS_STEPS } = options
  const originalRandom = Math.random
  const random = seededRandom(seed)
  Math.random = random
  let match = startPracticeMatch(HUMAN, `STRESS ${seed}`)
  const playedEffects = new Set()
  const firstPlayer = match.state.firstPlayer

  function step(action, payload = {}) {
    const next = submitPracticeAction(HUMAN, match.id, match.state_version, action, payload)
    match = { ...match, ...next }
  }

  try {
    for (let guard = 0; guard < maxSteps; guard += 1) {
      const s = match.state
      if (match.phase === 'GAME_OVER' || match.phase === 'TIE_BREAKER') {
        return { match, playedEffects, firstPlayer, steps: guard, terminal: true }
      }

      if (s.pendingSelfDiscard && isHumanOwner(s.pendingSelfDiscard.player)) {
        const count = Number(s.pendingSelfDiscard.count || 0)
        step('RESOLVE_SELF_DISCARD', { cardIds: s.player1.hand.slice(0, count) })
        continue
      }

      if (s.pendingBoardChoice && isHumanOwner(s.pendingBoardChoice.chooser)) {
        const cardId = s.pendingBoardChoice.cardIds?.[0]
        if (cardId == null) throw new Error(`Practice pending board choice has no legal target; seed=${seed}`)
        step('RESOLVE_BOARD_CHOICE', { cardId })
        continue
      }

      if (s.pendingChoice && isHumanOwner(s.pendingChoice.chooser)) {
        if (Number(s.pendingChoice.hiddenCount || 0) > 0) {
          step('RESOLVE_HIDDEN_CHOICE', { slot: 0 })
          continue
        }
        throw new Error(`Practice exposed an unresolved human choice with no public continuation; seed=${seed} kind=${s.pendingChoice.kind}`)
      }

      const hasPending = Boolean(s.pendingSelfDiscard || s.pendingBoardChoice || s.pendingChoice)

      if (!hasPending && s.phase === 'SET_VS' && s.needsVS?.[0]) {
        const hand = s.player1.hand
        const cardId = forceAggressive ? hand[0] : hand[Math.floor(random() * hand.length)]
        if (cardId == null) throw new Error(`Practice reached SET_VS with no human card before conclusion; seed=${seed}`)
        step('SET_VS', { cardId, position: forceAggressive ? 'ATK' : random() < 0.35 ? 'DEF' : 'ATK' })
        continue
      }

      if (!hasPending && s.phase === 'SET_VS' && !s.needsVS?.[0] && !s.needsVS?.[1] && s.firstPlayer === HUMAN) {
        step('BEGIN_ROUND')
        continue
      }

      if (!hasPending && s.phase === 'EFFECT' && (s.effectTurn === HUMAN || s.effectTurn === 0)) {
        if (exerciseEffects && !s.effectActionTaken?.[0] && random() < 0.72) {
          const candidates = s.player1.hand.filter((cardId) => SAFE_EFFECTS.has(cardId))
          while (candidates.length) {
            const index = Math.floor(random() * candidates.length)
            const cardId = candidates.splice(index, 1)[0]
            try {
              step('PLAY_EFFECT', { cardId })
              playedEffects.add(cardId)
              break
            } catch {
              // Situational Effect was illegal in this board state; try another candidate.
            }
          }
          if (match.state !== s) continue
        }
        step('END_EFFECT_TURN')
        continue
      }

      if (!hasPending && s.phase === 'ATTACK' && (s.attackTurn === HUMAN || s.attackTurn === 0)) {
        const canAttack = s.player1.vs?.position === 'ATK'
        step(canAttack && (forceAggressive || random() < 0.82) ? 'ATTACK' : 'PASS_ATTACK')
        continue
      }

      // Production deliberately paces the beginner bot one action at a time from
      // the Arena UI timer. Drive that same public tick here instead of assuming
      // submitPracticeAction immediately resolves every bot turn.
      const botTick = tickPracticeBot(HUMAN, match.id)
      if (botTick) {
        match = botTick
        continue
      }

      throw new Error(`Practice dead state before conclusion: phase=${s.phase} effectTurn=${s.effectTurn} attackTurn=${s.attackTurn} deck=${s.deckCount ?? s.deck?.length ?? 'hidden'} deckExhausted=${s.deckExhausted}`)
    }

    return { match, playedEffects, firstPlayer, steps: maxSteps, terminal: false }
  } finally {
    Math.random = originalRandom
  }
}

// Deterministic aggressive lifecycle: this must reach actual deck exhaustion and conclude.
const baseline = drivePracticeMatch(0x4d454741, { exerciseEffects: false, forceAggressive: true, maxSteps: 400 })
if (!baseline.terminal || (baseline.match.phase !== 'GAME_OVER' && baseline.match.phase !== 'TIE_BREAKER')) {
  throw new Error(`Practice aggressive lifecycle failed to conclude; final phase=${baseline.match.phase}`)
}
if (!baseline.match.state.deckExhausted) {
  throw new Error('Practice aggressive lifecycle concluded before exercising Master Deck exhaustion')
}

const projection = fs.readFileSync('src/game/arena-next/live/ArenaStateProjection.ts', 'utf8')
if (!projection.includes("value===match.player1_id")) {
  throw new Error('Arena Next projection no longer accepts UUID Effect-turn ownership for the local player')
}
if (!projection.includes("value===0||value==='0'")) {
  throw new Error('Arena Next projection no longer accepts normalized player-index 0 Effect-turn ownership')
}
if (!projection.includes("state.phase==='EFFECT'&&state.effectTurnIndex===me")) {
  throw new Error('Arena Next no longer exposes local Effect controls from the normalized Effect-turn owner')
}

let terminal = 0
let gameOver = 0
let tieBreaker = 0
let exhausted = 0
let humanFirst = 0
let botFirst = 0
let sampledSteps = 0
const effectCoverage = new Set()

for (let seed = 1; seed <= STRESS_MATCHES; seed += 1) {
  const result = drivePracticeMatch(0x9e3779b9 ^ seed, { exerciseEffects: true, forceAggressive: false, maxSteps: STRESS_STEPS })
  sampledSteps += result.steps
  if (result.terminal) {
    terminal += 1
    if (result.match.phase === 'GAME_OVER') gameOver += 1
    else if (result.match.phase === 'TIE_BREAKER') tieBreaker += 1
  }
  if (result.match.state.deckExhausted) exhausted += 1
  if (result.firstPlayer === HUMAN) humanFirst += 1
  else botFirst += 1
  for (const cardId of result.playedEffects) effectCoverage.add(cardId)
}

if (humanFirst === 0 || botFirst === 0) throw new Error(`Practice stress did not cover both starting-player paths: human=${humanFirst} bot=${botFirst}`)
if (effectCoverage.size < 10) throw new Error(`Practice stress under-covered Effect cards: ${effectCoverage.size} unique cards`)
if (terminal < Math.floor(STRESS_MATCHES * 0.85)) throw new Error(`Practice stress left too many non-terminal samples: ${terminal}/${STRESS_MATCHES}`)

console.log(`PASS real Practice aggressive lifecycle concludes via ${baseline.match.phase} after Master Deck exhaustion and Arena Next accepts both UUID and normalized player-index Effect ownership`)
console.log(`PRACTICE_STRESS_PASS ${STRESS_MATCHES} seeded matches sampled; transitions=${sampledSteps} terminal=${terminal} GAME_OVER=${gameOver} TIE_BREAKER=${tieBreaker} deckExhausted=${exhausted} humanFirst=${humanFirst} botFirst=${botFirst} effects=${effectCoverage.size}`)
