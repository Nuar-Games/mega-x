const VITE_ENV = import.meta.env ?? {};
const SUPABASE_URL = VITE_ENV.VITE_SUPABASE_URL || 'https://mmtorfzxnidsczcdygbp.supabase.co';
const SUPABASE_KEY = VITE_ENV.VITE_SUPABASE_KEY || 'sb_publishable_fXF7LXgKXeH4p5_Bwai0nQ_d-NWdOk_';
const SUPABASE_ENV = VITE_ENV.VITE_SUPABASE_ENV || 'production';
const SESSION_KEY = `mega-x-online-session-v1:${SUPABASE_ENV}`;
function headers(accessToken) {
    return {
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };
}
async function readJson(response) {
    const body = await response.json().catch(() => ({}));
    if (!response.ok)
        throw new Error(body?.msg || body?.message || body?.error_description || body?.error || `HTTP_${response.status}`);
    return body;
}
function sessionFromAuthPayload(payload) {
    const accessToken = payload?.access_token;
    const refreshToken = payload?.refresh_token;
    const userId = payload?.user?.id;
    if (!accessToken || !refreshToken || !userId)
        return null;
    return {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + Number(payload.expires_in || 3600) * 1000,
        userId,
        email: payload.user?.email,
    };
}
export function saveSession(session) {
    if (!session)
        localStorage.removeItem(SESSION_KEY);
    else
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
export function getSavedSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    }
}
export function consumeGoogleSessionFromHash() {
    if (!location.hash.includes('access_token='))
        return null;
    const params = new URLSearchParams(location.hash.slice(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken || !refreshToken)
        return null;
    const tokenPayload = JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const session = {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + Number(params.get('expires_in') || 3600) * 1000,
        userId: String(tokenPayload.sub),
        email: tokenPayload.email,
    };
    history.replaceState(null, '', location.pathname + location.search);
    saveSession(session);
    return session;
}
export async function signUpWithEmail(email, password) {
    const redirectTo = encodeURIComponent(`${location.origin}${location.pathname}`);
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup?redirect_to=${redirectTo}`, {
        method: 'POST', headers: headers(), body: JSON.stringify({ email, password }),
    });
    const payload = await readJson(response);
    const session = sessionFromAuthPayload(payload);
    if (session)
        saveSession(session);
    return { session, needsEmailConfirmation: !session };
}
export async function signInWithEmail(email, password) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST', headers: headers(), body: JSON.stringify({ email, password }),
    });
    const payload = await readJson(response);
    const session = sessionFromAuthPayload(payload);
    if (!session)
        throw new Error('SESSION_NOT_RETURNED');
    saveSession(session);
    return session;
}
export function signInWithGoogle() {
    const redirectTo = encodeURIComponent(`${location.origin}${location.pathname}`);
    location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`;
}
export async function refreshSession(session) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST', headers: headers(), body: JSON.stringify({ refresh_token: session.refreshToken }),
    });
    const payload = await readJson(response);
    const refreshed = sessionFromAuthPayload(payload);
    if (!refreshed)
        throw new Error('SESSION_REFRESH_FAILED');
    saveSession(refreshed);
    return refreshed;
}
export async function ensureSession(session) {
    const saved = getSavedSession();
    const current = saved && saved.userId === session.userId && saved.expiresAt > session.expiresAt ? saved : session;
    if (current.expiresAt - Date.now() > 60_000)
        return current;
    return refreshSession(current);
}
export async function loadProfile(session) {
    const live = await ensureSession(session);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(live.userId)}&select=id,fighter_handle`, {
        headers: headers(live.accessToken),
    });
    const rows = await readJson(response);
    return Array.isArray(rows) && rows.length ? rows[0] : null;
}
export async function claimFighterHandle(session, fighterHandle) {
    const live = await ensureSession(session);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/claim_fighter_handle`, {
        method: 'POST', headers: headers(live.accessToken), body: JSON.stringify({ p_handle: fighterHandle }),
    });
    return readJson(response);
}
export async function getTop10Leaderboard(session) {
    const live = await ensureSession(session);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_top_10_leaderboard`, {
        method: 'POST', headers: headers(live.accessToken), body: '{}',
    });
    return readJson(response);
}
export async function signOut(session) {
    if (session) {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: 'POST', headers: headers(session.accessToken) }).catch(() => undefined);
    }
    saveSession(null);
}
export async function heartbeatLobby(session, status = 'ONLINE') {
    const live = await ensureSession(session);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/heartbeat_lobby`, {
        method: 'POST', headers: headers(live.accessToken), body: JSON.stringify({ p_status: status }),
    });
    await readJson(response);
}
export async function leaveLobby(session) {
    const live = await ensureSession(session);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/leave_lobby`, {
        method: 'POST', headers: headers(live.accessToken), body: '{}',
    });
    await readJson(response);
}
export async function getOnlineFighters(session) {
    const live = await ensureSession(session);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_online_fighters`, {
        method: 'POST', headers: headers(live.accessToken), body: '{}',
    });
    return readJson(response);
}
export async function sendChallenge(session, targetPlayerId) {
    const live = await ensureSession(session);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/send_challenge`, {
        method: 'POST', headers: headers(live.accessToken), body: JSON.stringify({ p_target: targetPlayerId }),
    });
    return readJson(response);
}
export async function respondToChallenge(session, challengeId, accept) {
    const live = await ensureSession(session);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/respond_to_challenge`, {
        method: 'POST', headers: headers(live.accessToken), body: JSON.stringify({ p_challenge: challengeId, p_accept: accept }),
    });
    return readJson(response);
}
export async function cancelChallenge(session, challengeId) {
    const live = await ensureSession(session);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/cancel_challenge`, {
        method: 'POST', headers: headers(live.accessToken), body: JSON.stringify({ p_challenge: challengeId }),
    });
    return readJson(response);
}
export async function getMyActiveChallenge(session) {
    const live = await ensureSession(session);
    const challengeParams = new URLSearchParams({
        select: 'id,challenger_id,target_id,status,created_at,expires_at',
        status: 'eq.PENDING',
        expires_at: `gt.${new Date().toISOString()}`,
        or: `(challenger_id.eq.${live.userId},target_id.eq.${live.userId})`,
        order: 'created_at.desc',
        limit: '1',
    });
    const challengeResponse = await fetch(`${SUPABASE_URL}/rest/v1/challenges?${challengeParams.toString()}`, {
        headers: headers(live.accessToken),
    });
    const rows = await readJson(challengeResponse);
    if (!Array.isArray(rows) || !rows.length)
        return null;
    const row = rows[0];
    const profileParams = new URLSearchParams({
        select: 'id,fighter_handle',
        id: `in.(${row.challenger_id},${row.target_id})`,
    });
    const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?${profileParams.toString()}`, {
        headers: headers(live.accessToken),
    });
    const profiles = await readJson(profileResponse);
    const byId = new Map((Array.isArray(profiles) ? profiles : []).map((profile) => [profile.id, profile.fighter_handle]));
    return {
        ...row,
        challenger_handle: String(byId.get(row.challenger_id) ?? 'X FIGHTER'),
        target_handle: String(byId.get(row.target_id) ?? 'X FIGHTER'),
    };
}
export async function getGlobalChat(session) {
    const live = await ensureSession(session);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_global_chat`, {
        method: 'POST', headers: headers(live.accessToken), body: '{}',
    });
    return readJson(response);
}
export async function sendGlobalChat(session, message) {
    const live = await ensureSession(session);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/send_global_chat`, {
        method: 'POST', headers: headers(live.accessToken), body: JSON.stringify({ p_message: message }),
    });
    return readJson(response);
}
async function rpcAuthed(session, name, body = {}) {
    const live = await ensureSession(session);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
        method: 'POST', headers: headers(live.accessToken), body: JSON.stringify(body),
    });
    return readJson(response);
}
export async function getMyActiveMatch(session) {
    const rows = await rpcAuthed(session, 'get_my_active_match');
    return Array.isArray(rows) && rows.length ? rows[0] : null;
}
export async function heartbeatMatch(session, matchId) {
    await rpcAuthed(session, 'heartbeat_match', { p_match: matchId });
}
export async function resolveReconnectTimeout(session, matchId) {
    return Boolean(await rpcAuthed(session, 'resolve_reconnect_timeout', { p_match: matchId }));
}
export async function surrenderMatch(session, matchId) {
    await rpcAuthed(session, 'surrender_match', { p_match: matchId });
}
export async function chooseMatchCoin(session, matchId, choice) {
    return rpcAuthed(session, 'choose_match_coin', { p_match: matchId, p_choice: choice });
}
export async function startMatchAfterCoinSafe(session, matchId) {
    return rpcAuthed(session, 'start_match_after_coin_safe', { p_match: matchId });
}
export async function getMatchResultSummary(session, matchId) {
    const rows = await rpcAuthed(session, 'get_match_result_summary', { p_match: matchId });
    return Array.isArray(rows) && rows.length ? rows[0] : null;
}
export async function leaveMatchResult(session, matchId) {
    await rpcAuthed(session, 'leave_match_result', { p_match: matchId });
}
export async function joinMatchmaking(session) {
    const result = await rpcAuthed(session, 'join_matchmaking');
    return typeof result === 'string' ? result : null;
}
export async function cancelMatchmaking(session) {
    await rpcAuthed(session, 'cancel_matchmaking');
}
export async function getMatchmakingStatus(session) {
    const rows = await rpcAuthed(session, 'get_matchmaking_status');
    return Array.isArray(rows) && rows.length ? rows[0] : null;
}
export async function getMailInbox(session) {
    return rpcAuthed(session, 'get_mail_inbox');
}
export async function sendMail(session, recipientId, subject, body) {
    return rpcAuthed(session, 'send_mail', { p_recipient: recipientId, p_subject: subject, p_body: body });
}
export async function sendMailToHandle(session, fighterHandle, subject, body) {
    return rpcAuthed(session, 'send_mail_to_handle', { p_handle: fighterHandle, p_subject: subject, p_body: body });
}
export async function markMailRead(session, mailId) {
    await rpcAuthed(session, 'mark_mail_read', { p_mail: mailId });
}
export async function submitMatchSpecialAction(session, matchId, expectedVersion, action, payload = {}) {
    const rows = await rpcAuthed(session, 'submit_match_special_action', { p_match: matchId, p_expected_version: expectedVersion, p_action: action, p_payload: payload });
    return Array.isArray(rows) ? rows[0] : rows;
}
export async function submitMatchEngineAction(session, matchId, expectedVersion, action, payload = {}) {
    const live = await ensureSession(session);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/match-action`, {
        method: 'POST',
        headers: headers(live.accessToken),
        body: JSON.stringify({ matchId, expectedVersion, action, payload }),
    });
    return readJson(response);
}
