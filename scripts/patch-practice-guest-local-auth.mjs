import fs from 'node:fs'

const path='src/onlineAuth.ts'
let auth=fs.readFileSync(path,'utf8')

if(!auth.includes('export function isLocalPracticeSession')){
  const anchor='export type FighterProfile = {'
  if(!auth.includes(anchor))throw new Error('guest local-auth type anchor missing')
  auth=auth.replace(anchor,`export function isLocalPracticeSession(session: OnlineSession | null | undefined) {\n  return Boolean(session && (session.accessToken === 'practice-local' || session.userId.startsWith('practice-guest:')))\n}\n\n${anchor}`)
}

const replaceOnce=(from,to,label)=>{
  if(auth.includes(to))return
  if(!auth.includes(from))throw new Error(`guest local-auth anchor missing: ${label}`)
  auth=auth.replace(from,to)
}

replaceOnce(
`export async function ensureSession(session: OnlineSession) {\n  const saved = getSavedSession()`,
`export async function ensureSession(session: OnlineSession) {\n  if (isLocalPracticeSession(session)) return session\n  const saved = getSavedSession()`,
'ensureSession')

replaceOnce(
`export async function loadProfile(session: OnlineSession): Promise<FighterProfile | null> {\n  const live = await ensureSession(session)`,
`export async function loadProfile(session: OnlineSession): Promise<FighterProfile | null> {\n  if (isLocalPracticeSession(session)) return { id: session.userId, fighter_handle: 'GUEST X FIGHTER' }\n  const live = await ensureSession(session)`,
'loadProfile')

replaceOnce(
`export async function getTop10Leaderboard(session: OnlineSession): Promise<LeaderboardRow[]> {\n  const live = await ensureSession(session)`,
`export async function getTop10Leaderboard(session: OnlineSession): Promise<LeaderboardRow[]> {\n  if (isLocalPracticeSession(session)) return []\n  const live = await ensureSession(session)`,
'leaderboard')

replaceOnce(
`export async function signOut(session: OnlineSession | null) {\n  if (session) {`,
`export async function signOut(session: OnlineSession | null) {\n  if (isLocalPracticeSession(session)) { saveSession(null); return }\n  if (session) {`,
'signOut')

replaceOnce(
`export async function heartbeatLobby(session: OnlineSession, status: 'ONLINE' | 'IN_MATCH' | 'AWAY' = 'ONLINE') {\n  const live = await ensureSession(session)`,
`export async function heartbeatLobby(session: OnlineSession, status: 'ONLINE' | 'IN_MATCH' | 'AWAY' = 'ONLINE') {\n  if (isLocalPracticeSession(session)) return\n  const live = await ensureSession(session)`,
'heartbeatLobby')

replaceOnce(
`export async function leaveLobby(session: OnlineSession) {\n  const live = await ensureSession(session)`,
`export async function leaveLobby(session: OnlineSession) {\n  if (isLocalPracticeSession(session)) return\n  const live = await ensureSession(session)`,
'leaveLobby')

replaceOnce(
`export async function getOnlineFighters(session: OnlineSession): Promise<OnlineFighter[]> {\n  const live = await ensureSession(session)`,
`export async function getOnlineFighters(session: OnlineSession): Promise<OnlineFighter[]> {\n  if (isLocalPracticeSession(session)) return []\n  const live = await ensureSession(session)`,
'onlineFighters')

replaceOnce(
`export async function getMyActiveChallenge(session: OnlineSession): Promise<ActiveChallenge | null> {\n  const live = await ensureSession(session)`,
`export async function getMyActiveChallenge(session: OnlineSession): Promise<ActiveChallenge | null> {\n  if (isLocalPracticeSession(session)) return null\n  const live = await ensureSession(session)`,
'activeChallenge')

replaceOnce(
`export async function getGlobalChat(session: OnlineSession): Promise<GlobalChatMessage[]> {\n  const live = await ensureSession(session)`,
`export async function getGlobalChat(session: OnlineSession): Promise<GlobalChatMessage[]> {\n  if (isLocalPracticeSession(session)) return []\n  const live = await ensureSession(session)`,
'globalChat')

fs.writeFileSync(path,auth)
console.log('Patched guest Practice session to stay local and avoid authenticated server calls')
