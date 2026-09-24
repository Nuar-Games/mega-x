import { clearPracticeMatch, getPracticeMatchForUser, getPracticeResultSummary, isPracticeMatchId, submitPracticeAction, submitPracticeSpecialAction, surrenderPracticeMatch } from './practice-match'
import { createClient } from '@supabase/supabase-js'
export type OnlineSession = {
  accessToken: string
  refreshToken: string
  expiresAt: number
  userId: string
  email?: string
}

export function isLocalPracticeSession(session: OnlineSession | null | undefined) {
  return Boolean(session && (session.accessToken === 'practice-local' || session.userId.startsWith('practice-guest:')))
}

export type FighterProfile = {
  id: string
  fighter_handle: string | null
}

export type LeaderboardRow = {
  place: number
  player_id: string
  fighter_handle: string
  points: number
  wins: number
  losses: number
}

export type OnlineFighter = {
  player_id: string
  fighter_handle: string
  place: number
  points: number
  status: 'ONLINE' | 'IN_MATCH' | 'AWAY'
}

export type GlobalChatMessage = {
  id: number
  sender_id: string
  fighter_handle: string
  place: number
  message: string
  created_at: string
}

export type ActiveChallenge = {
  id: string
  challenger_id: string
  challenger_handle: string
  target_id: string
  target_handle: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED'
  created_at: string
  expires_at: string
}

const VITE_ENV = (import.meta as any).env ?? {}
const SUPABASE_URL = VITE_ENV.VITE_SUPABASE_URL || 'https://mmtorfzxnidsczcdygbp.supabase.co'
const SUPABASE_KEY = 'sb_publishable_fXF7LXgKXeH4p5_Bwai0nQ_d-NWdOk_'
const SUPABASE_ENV = VITE_ENV.VITE_SUPABASE_ENV || 'production'
const SESSION_KEY = `mega-x-online-session-v1:${SUPABASE_ENV}`

function headers(accessToken?: string) {
  return {
    apikey: SUPABASE_KEY,
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  }
}

async function readJson(response: Response) {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body?.msg || body?.message || body?.error_description || body?.error || `HTTP_${response.status}`)
  return body
}

function sessionFromAuthPayload(payload: any): OnlineSession | null {
  const accessToken = payload?.access_token
  const refreshToken = payload?.refresh_token
  const userId = payload?.user?.id
  if (!accessToken || !refreshToken || !userId) return null
  return {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
    userId,
    email: payload.user?.email,
  }
}

export function saveSession(session: OnlineSession | null) {
  if (!session) localStorage.removeItem(SESSION_KEY)
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function getSavedSession(): OnlineSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function consumeGoogleSessionFromHash(): OnlineSession | null {
  if (location.hash.includes('type=recovery')) return null
  if (!location.hash.includes('access_token=')) return null
  const params = new URLSearchParams(location.hash.slice(1))
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (!accessToken || !refreshToken) return null
  const tokenPayload = JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
  const session: OnlineSession = {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + Number(params.get('expires_in') || 3600) * 1000,
    userId: String(tokenPayload.sub),
    email: tokenPayload.email,
  }
  history.replaceState(null, '', location.pathname + location.search)
  saveSession(session)
  return session
}

export async function signUpWithEmail(email: string, password: string) {
  const redirectTo = encodeURIComponent(`${location.origin}${location.pathname}`)
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup?redirect_to=${redirectTo}`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ email, password }),
  })
  const payload = await readJson(response)
  const session = sessionFromAuthPayload(payload)
  if (!session) throw new Error('CHECK YOUR EMAIL TO CONFIRM YOUR ACCOUNT, THEN SIGN IN.')
  saveSession(session)
  return { session, needsEmailConfirmation: false }
}

export async function signInWithEmail(email: string, password: string) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: headers(), body: JSON.stringify({ email, password }), signal: controller.signal,
    })
    const payload = await readJson(response)
    const session = sessionFromAuthPayload(payload)
    if (!session) throw new Error('SESSION_NOT_RETURNED')
    saveSession(session)
    return session
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('SIGN_IN_TIMEOUT')
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim()
  if (!cleanEmail) throw new Error('EMAIL_REQUIRED')
  const redirectTo = encodeURIComponent(`${location.origin}/reset-password.html`)
  const response = await fetch(`${SUPABASE_URL}/auth/v1/recover?redirect_to=${redirectTo}`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ email: cleanEmail }),
  })
  await readJson(response)
}

export function consumeRecoverySessionFromHash(): OnlineSession | null {
  if (!location.hash.includes('access_token=')) return null
  const params = new URLSearchParams(location.hash.slice(1))
  if (params.get('type') !== 'recovery') return null
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (!accessToken || !refreshToken) return null
  const tokenPayload = JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
  const session: OnlineSession = {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + Number(params.get('expires_in') || 3600) * 1000,
    userId: String(tokenPayload.sub),
    email: tokenPayload.email,
  }
  history.replaceState(null, '', location.pathname + location.search)
  saveSession(session)
  return session
}

export async function updatePassword(session: OnlineSession, password: string): Promise<void> {
  if (password.length < 8) throw new Error('PASSWORD_TOO_SHORT')
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: 'PUT', headers: headers(session.accessToken), body: JSON.stringify({ password }),
  })
  await readJson(response)
}

export function signInWithGoogle() {
  const redirectTo = encodeURIComponent(`${location.origin}${location.pathname}`)
  location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`
}

export async function refreshSession(session: OnlineSession): Promise<OnlineSession> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ refresh_token: session.refreshToken }),
  })
  const payload = await readJson(response)
  const refreshed = sessionFromAuthPayload(payload)
  if (!refreshed) throw new Error('SESSION_REFRESH_FAILED')
  saveSession(refreshed)
  return refreshed
}

export async function ensureSession(session: OnlineSession) {
  if (isLocalPracticeSession(session)) return session
  const saved = getSavedSession()
  const current = saved && saved.userId === session.userId && saved.expiresAt > session.expiresAt ? saved : session
  if (current.expiresAt - Date.now() > 60_000) return current
  return refreshSession(current)
}

export async function loadProfile(session: OnlineSession): Promise<FighterProfile | null> {
  if (isLocalPracticeSession(session)) return { id: session.userId, fighter_handle: 'GUEST X FIGHTER' }
  const live = await ensureSession(session)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(live.userId)}&select=id,fighter_handle`, {
    headers: headers(live.accessToken),
  })
  const rows = await readJson(response)
  return Array.isArray(rows) && rows.length ? rows[0] : null
}

export async function claimFighterHandle(session: OnlineSession, fighterHandle: string): Promise<FighterProfile> {
  const live = await ensureSession(session)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/claim_fighter_handle`, {
    method: 'POST', headers: headers(live.accessToken), body: JSON.stringify({ p_handle: fighterHandle }),
  })
  return readJson(response)
}

export async function getTop10Leaderboard(session: OnlineSession): Promise<LeaderboardRow[]> {
  if (isLocalPracticeSession(session)) return []
  const live = await ensureSession(session)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_top_20_leaderboard`, {
    method: 'POST', headers: headers(live.accessToken), body: '{}',
  })
  return readJson(response)
}

export async function signOut(session: OnlineSession | null) {
  if (isLocalPracticeSession(session)) { saveSession(null); return }
  if (session) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: 'POST', headers: headers(session.accessToken) }).catch(() => undefined)
  }
  saveSession(null)
}

export async function heartbeatLobby(session: OnlineSession, status: 'ONLINE' | 'IN_MATCH' | 'AWAY' = 'ONLINE') {
  if (isLocalPracticeSession(session)) return
  const live = await ensureSession(session)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/heartbeat_lobby`, {
    method: 'POST', headers: headers(live.accessToken), body: JSON.stringify({ p_status: status }),
  })
  await readJson(response)
}

export async function leaveLobby(session: OnlineSession) {
  if (isLocalPracticeSession(session)) return
  const live = await ensureSession(session)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/leave_lobby`, {
    method: 'POST', headers: headers(live.accessToken), body: '{}',
  })
  await readJson(response)
}

export async function getOnlineFighters(session: OnlineSession): Promise<OnlineFighter[]> {
  if (isLocalPracticeSession(session)) return []
  const live = await ensureSession(session)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_online_fighters`, {
    method: 'POST', headers: headers(live.accessToken), body: '{}',
  })
  return readJson(response)
}

export async function sendChallenge(session: OnlineSession, targetPlayerId: string): Promise<ActiveChallenge> {
  const live = await ensureSession(session)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/send_challenge`, {
    method: 'POST', headers: headers(live.accessToken), body: JSON.stringify({ p_target: targetPlayerId }),
  })
  return readJson(response)
}

export async function respondToChallenge(session: OnlineSession, challengeId: string, accept: boolean): Promise<ActiveChallenge> {
  const live = await ensureSession(session)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/respond_to_challenge`, {
    method: 'POST', headers: headers(live.accessToken), body: JSON.stringify({ p_challenge: challengeId, p_accept: accept }),
  })
  return readJson(response)
}

export async function cancelChallenge(session: OnlineSession, challengeId: string): Promise<ActiveChallenge> {
  const live = await ensureSession(session)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/cancel_challenge`, {
    method: 'POST', headers: headers(live.accessToken), body: JSON.stringify({ p_challenge: challengeId }),
  })
  return readJson(response)
}

export async function getMyActiveChallenge(session: OnlineSession): Promise<ActiveChallenge | null> {
  if (isLocalPracticeSession(session)) return null
  const live = await ensureSession(session)
  const challengeParams = new URLSearchParams({
    select: 'id,challenger_id,target_id,status,created_at,expires_at',
    status: 'eq.PENDING',
    expires_at: `gt.${new Date().toISOString()}`,
    or: `(challenger_id.eq.${live.userId},target_id.eq.${live.userId})`,
    order: 'created_at.desc',
    limit: '1',
  })
  const challengeResponse = await fetch(`${SUPABASE_URL}/rest/v1/challenges?${challengeParams.toString()}`, {
    headers: headers(live.accessToken),
  })
  const rows = await readJson(challengeResponse)
  if (!Array.isArray(rows) || !rows.length) return null

  const row = rows[0]
  const profileParams = new URLSearchParams({
    select: 'id,fighter_handle',
    id: `in.(${row.challenger_id},${row.target_id})`,
  })
  const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?${profileParams.toString()}`, {
    headers: headers(live.accessToken),
  })
  const profiles = await readJson(profileResponse)
  const byId = new Map((Array.isArray(profiles) ? profiles : []).map((profile: any) => [profile.id, profile.fighter_handle]))

  return {
    ...row,
    challenger_handle: String(byId.get(row.challenger_id) ?? 'X FIGHTER'),
    target_handle: String(byId.get(row.target_id) ?? 'X FIGHTER'),
  } as ActiveChallenge
}

export async function getGlobalChat(session: OnlineSession): Promise<GlobalChatMessage[]> {
  if (isLocalPracticeSession(session)) return []
  const live = await ensureSession(session)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_global_chat`, {
    method: 'POST', headers: headers(live.accessToken), body: '{}',
  })
  return readJson(response)
}

export async function sendGlobalChat(session: OnlineSession, message: string) {
  const live = await ensureSession(session)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/send_global_chat`, {
    method: 'POST', headers: headers(live.accessToken), body: JSON.stringify({ p_message: message }),
  })
  return readJson(response)
}

export type ActiveOnlineMatch = {
  id: string
  player1_id: string
  player1_handle: string
  player2_id: string
  player2_handle: string
  status: 'VS_INTRO' | 'COIN_TOSS' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED'
  player1_start_place?: number | null
  player2_start_place?: number | null
  phase: string
  state_version: number
  state: any
  reconnect_deadline: string | null
  disconnected_player: string | null
}

export type MatchResultSummary = {
  winner_id: string
  loser_id: string
  winner_points_delta: number
  loser_points_delta: number
  scored: boolean
  my_points: number
  my_place: number
  my_start_points: number
  my_start_place: number
}

export type MatchmakingStatus = {
  status: 'WAITING' | 'MATCHED' | string
  match_id: string | null
  joined_at: string | null
}

export type MailMessage = {
  id: number
  sender_id: string
  sender_handle: string
  sender_place: number
  subject: string
  body: string
  created_at: string
  read_at: string | null
}

async function rpcAuthed(session: OnlineSession, name: string, body: Record<string, unknown> = {}) {
  const live = await ensureSession(session)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST', headers: headers(live.accessToken), body: JSON.stringify(body),
  })
  return readJson(response)
}

export async function getMyActiveMatch(session: OnlineSession): Promise<ActiveOnlineMatch | null> {
  const practice = getPracticeMatchForUser(session.userId)
  if (practice) return practice as ActiveOnlineMatch
  const rows = await rpcAuthed(session, 'get_my_active_match')
  return Array.isArray(rows) && rows.length ? rows[0] : null
}

export async function heartbeatMatch(session: OnlineSession, matchId: string) {
  if (isPracticeMatchId(matchId)) return
  await rpcAuthed(session, 'heartbeat_match', { p_match: matchId })
}

export async function resolveReconnectTimeout(session: OnlineSession, matchId: string): Promise<boolean> {
  if (isPracticeMatchId(matchId)) return false
  return Boolean(await rpcAuthed(session, 'resolve_reconnect_timeout', { p_match: matchId }))
}

export async function resolveActionTimeout(session: OnlineSession, matchId: string): Promise<boolean> {
  if (isPracticeMatchId(matchId)) return false
  return Boolean(await rpcAuthed(session, 'resolve_action_timeout', { p_match: matchId }))
}

export async function surrenderMatch(session: OnlineSession, matchId: string) {
  if (isPracticeMatchId(matchId)) { clearPracticeMatch(session.userId, matchId); window.dispatchEvent(new CustomEvent('mega-x:practice-exit')); return }
  await rpcAuthed(session, 'surrender_match', { p_match: matchId })
}

export async function chooseMatchCoin(session: OnlineSession, matchId: string, choice: 'X' | 'BLANK') {
  return rpcAuthed(session, 'choose_match_coin', { p_match: matchId, p_choice: choice })
}

export async function startMatchAfterCoinSafe(session: OnlineSession, matchId: string) {
  return rpcAuthed(session, 'start_match_after_coin_safe', { p_match: matchId })
}

export async function getMatchResultSummary(session: OnlineSession, matchId: string): Promise<MatchResultSummary | null> {
  if (isPracticeMatchId(matchId)) return getPracticeResultSummary(session.userId, matchId) as MatchResultSummary | null
  const rows = await rpcAuthed(session, 'get_match_result_summary', { p_match: matchId })
  return Array.isArray(rows) && rows.length ? rows[0] : null
}

export async function leaveMatchResult(session: OnlineSession, matchId: string) {
  if (isPracticeMatchId(matchId)) { clearPracticeMatch(session.userId, matchId); return }
  await rpcAuthed(session, 'leave_match_result', { p_match: matchId })
}

export async function joinMatchmaking(session: OnlineSession): Promise<string | null> {
  const result = await rpcAuthed(session, 'join_matchmaking')
  return typeof result === 'string' ? result : null
}

export async function cancelMatchmaking(session: OnlineSession) {
  await rpcAuthed(session, 'cancel_matchmaking')
}

export async function getMatchmakingStatus(session: OnlineSession): Promise<MatchmakingStatus | null> {
  const rows = await rpcAuthed(session, 'get_matchmaking_status')
  return Array.isArray(rows) && rows.length ? rows[0] : null
}

export async function getMailInbox(session: OnlineSession): Promise<MailMessage[]> {
  return rpcAuthed(session, 'get_mail_inbox')
}

export async function sendMail(session: OnlineSession, recipientId: string, subject: string, body: string) {
  return rpcAuthed(session, 'send_mail', { p_recipient: recipientId, p_subject: subject, p_body: body })
}

export async function sendMailToHandle(session: OnlineSession, fighterHandle: string, subject: string, body: string) {
  return rpcAuthed(session, 'send_mail_to_handle', { p_handle: fighterHandle, p_subject: subject, p_body: body })
}

export async function markMailRead(session: OnlineSession, mailId: number) {
  await rpcAuthed(session, 'mark_mail_read', { p_mail: mailId })
}

export async function submitMatchSpecialAction(session: OnlineSession, matchId: string, expectedVersion: number, action: string, payload: Record<string, unknown> = {}) {
  if (isPracticeMatchId(matchId)) return submitPracticeSpecialAction(session.userId, matchId, expectedVersion, action, payload)
  const rows = await rpcAuthed(session, 'submit_match_special_action', { p_match: matchId, p_expected_version: expectedVersion, p_action: action, p_payload: payload })
  return Array.isArray(rows) ? rows[0] : rows
}

export async function submitMatchEngineAction(session: OnlineSession, matchId: string, expectedVersion: number, action: string, payload: Record<string, unknown> = {}) {
  if (isPracticeMatchId(matchId)) return submitPracticeAction(session.userId, matchId, expectedVersion, action, payload)
  const live = await ensureSession(session)
  const response = await fetch(`${SUPABASE_URL}/functions/v1/match-action`, {
    method: 'POST',
    headers: headers(live.accessToken),
    body: JSON.stringify({ matchId, expectedVersion, action, payload }),
  })
  return readJson(response)
}
const REALTIME_CLIENT = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

export function subscribeToMatchChanges(session: OnlineSession, matchId: string, onChange: () => void, onStatus?: (healthy: boolean) => void) {
  if (isPracticeMatchId(matchId)) { onStatus?.(true); return () => onStatus?.(false) }
  let disposed = false
  let channel: ReturnType<typeof REALTIME_CLIENT.channel> | null = null
  void REALTIME_CLIENT.realtime.setAuth(session.accessToken).then(() => {
    if (disposed) return
    channel = REALTIME_CLIENT
      .channel(`mega-x-match:${matchId}`, { config: { private: true } })
      .on('broadcast', { event: 'match_updated' }, () => onChange())
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') onStatus?.(true)
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') onStatus?.(false)
      })
  }).catch(() => onStatus?.(false))
  return () => {
    disposed = true
    onStatus?.(false)
    if (channel) void REALTIME_CLIENT.removeChannel(channel)
  }
}


export type AdminStatus = {
  is_admin: boolean
  silenced: boolean
  suspended: boolean
  silenced_until: string | null
  suspended_until: string | null
}

export type AdminPlayerRow = {
  user_id: string
  fighter_handle: string | null
  email: string | null
  silenced: boolean
  suspended: boolean
  silenced_until: string | null
  suspended_until: string | null
}

export async function getMyAdminStatus(session: OnlineSession): Promise<AdminStatus> {
  if (isLocalPracticeSession(session)) return { is_admin: false, silenced: false, suspended: false, silenced_until: null, suspended_until: null }
  const rows = await rpcAuthed(session, 'get_my_admin_status')
  const row = Array.isArray(rows) ? rows[0] : rows
  return row || { is_admin: false, silenced: false, suspended: false, silenced_until: null, suspended_until: null }
}

export async function adminListPlayers(session: OnlineSession): Promise<AdminPlayerRow[]> {
  if (isLocalPracticeSession(session)) return []
  return rpcAuthed(session, 'admin_list_players')
}

export async function adminSetSilenced(session: OnlineSession, playerId: string, enabled: boolean) {
  if (isLocalPracticeSession(session)) return
  await rpcAuthed(session, 'admin_set_silenced', { p_player: playerId, p_enabled: enabled })
}

export async function adminSetSuspended(session: OnlineSession, playerId: string, enabled: boolean) {
  if (isLocalPracticeSession(session)) return
  await rpcAuthed(session, 'admin_set_suspended', { p_player: playerId, p_enabled: enabled })
}
