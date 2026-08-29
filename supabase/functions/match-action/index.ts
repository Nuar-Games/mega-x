import { applyEngineAction, type EngineState } from './engine.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const serviceHeaders = { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json' }
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function actorFromJwt(req: Request) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) throw new Error('AUTH_REQUIRED')
  const payloadPart = token.split('.')[1]
  if (!payloadPart) throw new Error('AUTH_REQUIRED')
  const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4)
  const payload = JSON.parse(atob(padded))
  if (!payload?.sub) throw new Error('AUTH_REQUIRED')
  return String(payload.sub)
}

async function rpc(name: string, body: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, { method: 'POST', headers: serviceHeaders, body: JSON.stringify(body) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.message || data?.hint || data?.code || `RPC_${response.status}`)
  return data
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  try {
    const actorId = actorFromJwt(req)
    const body = await req.json()
    const matchId = String(body.matchId || '')
    const expectedVersion = Number(body.expectedVersion)
    const action = String(body.action || '')
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {}
    if (!matchId || !Number.isFinite(expectedVersion) || !action) throw new Error('INVALID_REQUEST')

    const rows = await rpc('get_match_engine_state', { p_match: matchId, p_actor: actorId })
    const match = Array.isArray(rows) ? rows[0] : rows
    if (!match) throw new Error('MATCH_NOT_FOUND')
    if (Number(match.state_version) !== expectedVersion) throw new Error('STALE_MATCH_STATE')
    if (match.status === 'PAUSED') throw new Error('MATCH_PAUSED')
    if (match.status !== 'ACTIVE') throw new Error('MATCH_NOT_ACTIVE')

    const nextState = applyEngineAction({
      state: match.state as EngineState,
      meta: { player1_id: match.player1_id, player2_id: match.player2_id },
      actorId,
      action: { action, payload },
    })

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
    const status = message.includes('STALE_MATCH_STATE') ? 409 : message.includes('AUTH_REQUIRED') ? 401 : 400
    return new Response(JSON.stringify({ error: message }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
  }
})
