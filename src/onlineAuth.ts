export type OnlineSession = {
  accessToken: string
  refreshToken: string
  expiresAt: number
  userId: string
  email?: string
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
const SUPABASE_KEY = VITE_ENV.VITE_SUPABASE_KEY || 'sb_publishable_EMVTyrv3gGmmouCiVix4dg__W3zuzMc'
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
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ email, password }),
  })
  const payload = await readJson(response)
  const session = sessionFromAuthPayload(payload)
  if (!session) throw new Error('SESSION_NOT_RETURNED')
  saveSession(session)
  return session
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
  const saved = getSavedSession()
  const current = saved && saved.userId === session.userId && saved.expiresAt > session.expiresAt ? saved : session
  if (current.expiresAt - Date.now() > 60_000) return current
  return refreshSession(current)
}

export async function loadProfile(session: OnlineSession): Promise<FighterProfile | null> {
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
  const live = await ensureSession(session)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_top_10_leaderboard`, {
    method: 'POST', headers: headers(live.accessToken), body: '{}',
  })
  return readJson(response)
}

export async function signOut(session: OnlineSession | null) {
  if (session) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: 'POST', headers: headers(session.accessToken) }).catch(() => undefined)
  }
  saveSession(null)
}

export async function heartbeatLobby(session: OnlineSession, status: 'ONLINE' | 'IN_MATCH' | 'AWAY' = 'ONLINE') {
  const live = await ensureSession(session)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/heartbeat_lobby`, {
    method: 'POST', headers: headers(live.accessToken), body: JSON.stringify({ p_status: status }),
  })
  await readJson(response)
}

export async function leaveLobby(session: OnlineSession) {
  const live = await ensureSession(session)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/leave_lobby`, {
    method: 'POST', headers: headers(live.accessToken), body: '{}',
  })
  await readJson(response)
}

export async function getOnlineFighters(session: OnlineSession): Promise<OnlineFighter[]> {
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
  status: 'COIN_TOSS' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED'
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
  const rows = await rpcAuthed(session, 'get_my_active_match')
  return Array.isArray(rows) && rows.length ? rows[0] : null
}

export async function heartbeatMatch(session: OnlineSession, matchId: string) {
  await rpcAuthed(session, 'heartbeat_match', { p_match: matchId })
}

export async function resolveReconnectTimeout(session: OnlineSession, matchId: string): Promise<boolean> {
  return Boolean(await rpcAuthed(session, 'resolve_reconnect_timeout', { p_match: matchId }))
}

export async function surrenderMatch(session: OnlineSession, matchId: string) {
  await rpcAuthed(session, 'surrender_match', { p_match: matchId })
}

export async function chooseMatchCoin(session: OnlineSession, matchId: string, choice: 'X' | 'BLANK') {
  return rpcAuthed(session, 'choose_match_coin', { p_match: matchId, p_choice: choice })
}

export async function startMatchAfterCoinSafe(session: OnlineSession, matchId: string) {
  return rpcAuthed(session, 'start_match_after_coin_safe', { p_match: matchId })
}

export async function getMatchResultSummary(session: OnlineSession, matchId: string): Promise<MatchResultSummary | null> {
  const rows = await rpcAuthed(session, 'get_match_result_summary', { p_match: matchId })
  return Array.isArray(rows) && rows.length ? rows[0] : null
}

export async function leaveMatchResult(session: OnlineSession, matchId: string) {
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
  const rows = await rpcAuthed(session, 'submit_match_special_action', { p_match: matchId, p_expected_version: expectedVersion, p_action: action, p_payload: payload })
  return Array.isArray(rows) ? rows[0] : rows
}

export async function submitMatchEngineAction(session: OnlineSession, matchId: string, expectedVersion: number, action: string, payload: Record<string, unknown> = {}) {
  const live = await ensureSession(session)
  const response = await fetch(`${SUPABASE_URL}/functions/v1/match-action`, {
    method: 'POST',
    headers: headers(live.accessToken),
    body: JSON.stringify({ matchId, expectedVersion, action, payload }),
  })
  return readJson(response)
}