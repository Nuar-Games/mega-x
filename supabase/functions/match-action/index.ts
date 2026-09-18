import { applyEngineAction, type EngineState } from './engine.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const serviceHeaders = { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json' }
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function bearerToken(req: Request) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) throw new Error('AUTH_REQUIRED')
  return token
}

async function actorFromJwt(req: Request) {
  const token = bearerToken(req)
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  })
  const user = await response.json().catch(() => ({}))
  if (!response.ok || !user?.id) throw new Error('AUTH_REQUIRED')
  return String(user.id)
}

async function assertMatchPlayer(matchId: string, actorId: string) {
  const params = new URLSearchParams({
    select: 'id,player1_id,player2_id',
    id: `eq.${matchId}`,
    limit: '1',
  })
  const response = await fetch(`${SUPABASE_URL}/rest/v1/matches?${params.toString()}`, { headers: serviceHeaders })
  const rows = await response.json().catch(() => [])
  if (!response.ok) throw new Error(rows?.message || rows?.hint || rows?.code || `MATCH_LOOKUP_${response.status}`)
  const match = Array.isArray(rows) ? rows[0] : rows
  if (!match) throw new Error('MATCH_NOT_FOUND')
  if (actorId !== String(match.player1_id) && actorId !== String(match.player2_id)) throw new Error('NOT_MATCH_PLAYER')
}

async function rpc(name: string, body: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, { method: 'POST', headers: serviceHeaders, body: JSON.stringify(body) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.message || data?.hint || data?.code || `RPC_${response.status}`)
  return data
}

function shuffleIds() {
  const out = Array.from({ length: 30 }, (_, i) => i + 1)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function preserveExhaustedDeckTurnCompletion(nextState: EngineState, previousState: EngineState, action: string, actorId: string, player1Id: string, player2Id: string) {
  if (!previousState.deckExhausted) return
  const normalized = action.toUpperCase()

  // BEGIN_ROUND is not a legal match-ending point once the deck is empty.
  // Mandatory setup has completed, so the active Effect turn must begin normally.
  if (normalized === 'BEGIN_ROUND' && (nextState.phase === 'GAME_OVER' || nextState.phase === 'TIE_BREAKER')) {
    nextState.phase = 'EFFECT'
    nextState.effectTurn = nextState.firstPlayer
    nextState.attackTurn = null
    nextState.winner = null
    nextState.tieBreaker = null
    const firstLabel = nextState.firstPlayer === player1Id ? 'X Fighter 1' : 'X Fighter 2'
    nextState.message = `Pusingan ${nextState.round}: giliran Effect ${firstLabel}.`
    return
  }

  // Once the non-active player has completed their Effect turn, the Master Deck
  // terminates the match before a new attack decision begins.
  if (normalized !== 'END_EFFECT_TURN' || nextState.phase !== 'ATTACK') return
  const nonActiveId = nextState.firstPlayer === player1Id ? player2Id : player1Id
  if (actorId !== nonActiveId) return

  const x1 = nextState.player1.x.length
  const x2 = nextState.player2.x.length
  nextState.effectTurn = null
  nextState.attackTurn = null
  if (x1 !== x2) {
    nextState.phase = 'GAME_OVER'
    nextState.winner = x1 > x2 ? player1Id : player2Id
    nextState.tieBreaker = null
    nextState.message = `Master Deck habis. Zon X ${x1}-${x2}.`
  } else {
    nextState.phase = 'TIE_BREAKER'
    nextState.winner = null
    nextState.tieBreaker = { deck: shuffleIds(), index: 0, left: null, right: null, status: 'WAITING', pair: 0 }
    nextState.message = 'PENENTUAN SERI'
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  try {
    const actorId = await actorFromJwt(req)
    const body = await req.json()
    const matchId = String(body.matchId || '')
    const expectedVersion = Number(body.expectedVersion)
    const action = String(body.action || '')
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {}
    if (!matchId || !Number.isFinite(expectedVersion) || !action) throw new Error('INVALID_REQUEST')

    await assertMatchPlayer(matchId, actorId)

    const rows = await rpc('get_match_engine_state', { p_match: matchId, p_actor: actorId })
    const match = Array.isArray(rows) ? rows[0] : rows
    if (!match) throw new Error('MATCH_NOT_FOUND')
    if (Number(match.state_version) !== expectedVersion) throw new Error('STALE_MATCH_STATE')
    if (match.status === 'PAUSED') throw new Error('MATCH_PAUSED')
    if (match.status !== 'ACTIVE') throw new Error('MATCH_NOT_ACTIVE')

    const previousState = match.state as EngineState
    const nextState = applyEngineAction({
      state: previousState,
      meta: { player1_id: match.player1_id, player2_id: match.player2_id },
      actorId,
      action: { action, payload },
    })

    preserveExhaustedDeckTurnCompletion(nextState, previousState, action, actorId, match.player1_id, match.player2_id)

    const commitRows = await rpc('commit_match_engine_state', {
      p_match: matchId,
      p_expected_version: expectedVersion,
      p_actor: actorId,
      p_action: action,
      p_payload: payload,
      p_state: nextState,
      p_phase: nextState.phase,
    })
    const commit = Array.isArray(commitRows) ? commitRows[0] : commitRows
    const redacted = await rpc('redact_match_state', {
      p_state: commit.state,
      p_viewer: actorId,
      p_player1: commit.player1_id,
      p_player2: commit.player2_id,
    })

    return new Response(JSON.stringify({ state: redacted, state_version: commit.state_version, phase: commit.phase, status: commit.status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'MATCH_ACTION_FAILED'
    const status = message.includes('STALE_MATCH_STATE') ? 409 : message.includes('AUTH_REQUIRED') ? 401 : message.includes('NOT_MATCH_PLAYER') ? 403 : 400
    return new Response(JSON.stringify({ error: message }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
  }
})
