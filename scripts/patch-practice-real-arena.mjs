import fs from 'node:fs'

const appPath = 'src/App.tsx'
const authPath = 'src/onlineAuth.ts'
const vsPath = 'src/VsIntro.tsx'
let app = fs.readFileSync(appPath, 'utf8')
let auth = fs.readFileSync(authPath, 'utf8')
let vs = fs.readFileSync(vsPath, 'utf8')

const mustReplace = (source, from, to, label) => {
  if (source.includes(to)) return source
  // The final verified practice surrender path clears the local match and emits
  // the arena-exit event directly. It supersedes the older surrenderPracticeMatch
  // form this patch originally installed, so preserve it when already present.
  if (label === 'surrenderMatch' && source.includes("if (isPracticeMatchId(matchId)) { clearPracticeMatch(session.userId, matchId); window.dispatchEvent(new CustomEvent('mega-x:practice-exit')); return }")) return source
  if (!source.includes(from)) throw new Error(`practice real-arena patch target missing: ${label}`)
  return source.replace(from, to)
}

if (!app.includes("from './practice-match'")) {
  const importAnchor = app.match(/import \{[^\n]+\} from '\.\/onlineAuth'\n/)
  if (!importAnchor) throw new Error('practice real-arena onlineAuth import anchor missing')
  app = app.replace(importAnchor[0], `${importAnchor[0]}import { startPracticeMatch } from './practice-match'\n`)
}

if (!app.includes("mega-x:start-practice-match")) {
  const hookAnchor = '  async function challengeFighter'
  if (!app.includes(hookAnchor)) throw new Error('practice real-arena hook anchor missing')
  const hook = `  useEffect(() => {\n    const startPractice = () => {\n      if (!onlineSession) {\n        const guestKey = 'mega-x-practice-guest-id-v1'\n        let guestId = window.localStorage.getItem(guestKey)\n        if (!guestId) {\n          guestId = 'practice-guest:' + crypto.randomUUID()\n          window.localStorage.setItem(guestKey, guestId)\n        }\n        const practiceSession = { accessToken: 'practice-local', refreshToken: 'practice-local', expiresAt: Number.MAX_SAFE_INTEGER, userId: guestId }\n        setOnlineSession(practiceSession)\n        window.setTimeout(() => window.dispatchEvent(new CustomEvent('mega-x:start-practice-match')), 0)\n        return\n      }\n      const match = startPracticeMatch(onlineSession.userId, fighterProfile?.fighter_handle || 'GUEST X FIGHTER')\n      applyOnlineMatchView(match as any)\n    }\n    window.addEventListener('mega-x:start-practice-match', startPractice)\n    return () => window.removeEventListener('mega-x:start-practice-match', startPractice)\n  }, [onlineSession?.userId, fighterProfile?.fighter_handle])\n\n`
  app = app.replace(hookAnchor, hook + hookAnchor)
}

if (!app.includes('mx-practice-now')) {
  const playButton = `<button className="mx-play-now" onClick={() => { if (activeOnlineMatch) applyOnlineMatchView(activeOnlineMatch); else setOnlineScreen(onlineSession ? (fighterProfile?.fighter_handle ? 'LOBBY' : 'HANDLE') : 'AUTH') }}>{activeOnlineMatch ? 'RESUME MATCH' : 'PLAY NOW'}</button>`
  if (!app.includes(playButton)) throw new Error('practice visible CTA landing anchor missing')
  app = app.replace(playButton, `${playButton}\n          {!activeOnlineMatch && <button className="mx-practice-now" onClick={() => window.dispatchEvent(new CustomEvent('mega-x:start-practice-match'))}>PRACTICE — PLAY AS GUEST</button>}`)
}

if (!auth.includes("from './practice-match'")) {
  auth = `import { clearPracticeMatch, getPracticeMatchForUser, getPracticeResultSummary, isPracticeMatchId, submitPracticeAction, submitPracticeSpecialAction, surrenderPracticeMatch } from './practice-match'\n` + auth
}

if (!auth.includes('const practice = getPracticeMatchForUser(session.userId)')) auth = mustReplace(auth,
`export async function getMyActiveMatch(session: OnlineSession): Promise<ActiveOnlineMatch | null> {\n  const rows = await rpcAuthed(session, 'get_my_active_match')`,
`export async function getMyActiveMatch(session: OnlineSession): Promise<ActiveOnlineMatch | null> {\n  const practice = getPracticeMatchForUser(session.userId)\n  if (practice) return practice as ActiveOnlineMatch\n  const rows = await rpcAuthed(session, 'get_my_active_match')`,
'getMyActiveMatch')

if (!auth.includes('if (isPracticeMatchId(matchId)) return\n  await rpcAuthed(session, \'heartbeat_match\'')) auth = mustReplace(auth,
`export async function heartbeatMatch(session: OnlineSession, matchId: string) {\n  await rpcAuthed(session, 'heartbeat_match', { p_match: matchId })`,
`export async function heartbeatMatch(session: OnlineSession, matchId: string) {\n  if (isPracticeMatchId(matchId)) return\n  await rpcAuthed(session, 'heartbeat_match', { p_match: matchId })`,
'heartbeatMatch')

if (!auth.includes('if (isPracticeMatchId(matchId)) return false\n  return Boolean(await rpcAuthed(session, \'resolve_reconnect_timeout\'')) auth = mustReplace(auth,
`export async function resolveReconnectTimeout(session: OnlineSession, matchId: string): Promise<boolean> {\n  return Boolean(await rpcAuthed(session, 'resolve_reconnect_timeout', { p_match: matchId }))`,
`export async function resolveReconnectTimeout(session: OnlineSession, matchId: string): Promise<boolean> {\n  if (isPracticeMatchId(matchId)) return false\n  return Boolean(await rpcAuthed(session, 'resolve_reconnect_timeout', { p_match: matchId }))`,
'resolveReconnectTimeout')

if (auth.includes(`export async function resolveActionTimeout(session: OnlineSession, matchId: string): Promise<boolean> {\n  return Boolean(await rpcAuthed(session, 'resolve_action_timeout', { p_match: matchId }))`)) {
  auth = auth.replace(
`export async function resolveActionTimeout(session: OnlineSession, matchId: string): Promise<boolean> {\n  return Boolean(await rpcAuthed(session, 'resolve_action_timeout', { p_match: matchId }))`,
`export async function resolveActionTimeout(session: OnlineSession, matchId: string): Promise<boolean> {\n  if (isPracticeMatchId(matchId)) return false\n  return Boolean(await rpcAuthed(session, 'resolve_action_timeout', { p_match: matchId }))`)
}

if (!auth.includes('if (isPracticeMatchId(matchId)) { surrenderPracticeMatch') && !auth.includes("if (isPracticeMatchId(matchId)) { clearPracticeMatch(session.userId, matchId); window.dispatchEvent(new CustomEvent('mega-x:practice-exit')); return }")) auth = mustReplace(auth,
`export async function surrenderMatch(session: OnlineSession, matchId: string) {\n  await rpcAuthed(session, 'surrender_match', { p_match: matchId })`,
`export async function surrenderMatch(session: OnlineSession, matchId: string) {\n  if (isPracticeMatchId(matchId)) { surrenderPracticeMatch(session.userId, matchId); return }\n  await rpcAuthed(session, 'surrender_match', { p_match: matchId })`,
'surrenderMatch')

if (!auth.includes('if (isPracticeMatchId(matchId)) return getPracticeResultSummary')) auth = mustReplace(auth,
`export async function getMatchResultSummary(session: OnlineSession, matchId: string): Promise<MatchResultSummary | null> {\n  const rows = await rpcAuthed(session, 'get_match_result_summary', { p_match: matchId })`,
`export async function getMatchResultSummary(session: OnlineSession, matchId: string): Promise<MatchResultSummary | null> {\n  if (isPracticeMatchId(matchId)) return getPracticeResultSummary(session.userId, matchId) as MatchResultSummary | null\n  const rows = await rpcAuthed(session, 'get_match_result_summary', { p_match: matchId })`,
'getMatchResultSummary')

if (!auth.includes('if (isPracticeMatchId(matchId)) { clearPracticeMatch')) auth = mustReplace(auth,
`export async function leaveMatchResult(session: OnlineSession, matchId: string) {\n  await rpcAuthed(session, 'leave_match_result', { p_match: matchId })`,
`export async function leaveMatchResult(session: OnlineSession, matchId: string) {\n  if (isPracticeMatchId(matchId)) { clearPracticeMatch(session.userId, matchId); return }\n  await rpcAuthed(session, 'leave_match_result', { p_match: matchId })`,
'leaveMatchResult')

if (!auth.includes('if (isPracticeMatchId(matchId)) return submitPracticeSpecialAction')) auth = mustReplace(auth,
`export async function submitMatchSpecialAction(session: OnlineSession, matchId: string, expectedVersion: number, action: string, payload: Record<string, unknown> = {}) {\n  const rows = await rpcAuthed(session, 'submit_match_special_action', { p_match: matchId, p_expected_version: expectedVersion, p_action: action, p_payload: payload })`,
`export async function submitMatchSpecialAction(session: OnlineSession, matchId: string, expectedVersion: number, action: string, payload: Record<string, unknown> = {}) {\n  if (isPracticeMatchId(matchId)) return submitPracticeSpecialAction(session.userId, matchId, expectedVersion, action, payload)\n  const rows = await rpcAuthed(session, 'submit_match_special_action', { p_match: matchId, p_expected_version: expectedVersion, p_action: action, p_payload: payload })`,
'submitMatchSpecialAction')

if (!auth.includes('if (isPracticeMatchId(matchId)) return submitPracticeAction')) auth = mustReplace(auth,
`export async function submitMatchEngineAction(session: OnlineSession, matchId: string, expectedVersion: number, action: string, payload: Record<string, unknown> = {}) {\n  const live = await ensureSession(session)`,
`export async function submitMatchEngineAction(session: OnlineSession, matchId: string, expectedVersion: number, action: string, payload: Record<string, unknown> = {}) {\n  if (isPracticeMatchId(matchId)) return submitPracticeAction(session.userId, matchId, expectedVersion, action, payload)\n  const live = await ensureSession(session)`,
'submitMatchEngineAction')

if (!auth.includes('if (isPracticeMatchId(matchId)) { onStatus?.(true)')) {
  const subPattern = /(export function subscribeToMatchChanges\([^\n]+\) \{\n)/
  if (!subPattern.test(auth)) throw new Error('practice real-arena subscribe anchor missing')
  auth = auth.replace(subPattern, `$1  if (isPracticeMatchId(matchId)) { onStatus?.(true); return () => onStatus?.(false) }\n`)
}

if (!vs.includes("from './practice-match'")) vs = `import { getPracticeMatchForUser } from './practice-match'\n` + vs
const vsOld = `export async function getMyActiveMatchVsIntro(session: OnlineSession): Promise<ActiveOnlineMatch|null> { const rows=await vsIntroRpc(session,'get_my_active_match_vs_intro'); return Array.isArray(rows)&&rows.length?rows[0]:null }`
const vsNew = `export async function getMyActiveMatchVsIntro(session: OnlineSession): Promise<ActiveOnlineMatch|null> { const practice=getPracticeMatchForUser(session.userId); if(practice)return practice as ActiveOnlineMatch; const rows=await vsIntroRpc(session,'get_my_active_match_vs_intro'); return Array.isArray(rows)&&rows.length?rows[0]:null }`
if (!vs.includes('const practice=getPracticeMatchForUser(session.userId)')) vs = mustReplace(vs, vsOld, vsNew, 'VsIntro active match refresh')

fs.writeFileSync(appPath, app)
fs.writeFileSync(authPath, auth)
fs.writeFileSync(vsPath, vs)
console.log('Applied guest-first real-Arena Practice routing with zero Practice server traffic and visible CTA')
