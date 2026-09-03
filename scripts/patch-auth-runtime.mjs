import fs from 'node:fs'

const path = 'src/onlineAuth.ts'
let source = fs.readFileSync(path, 'utf8')
const active = 'sb_publishable_fXF7LXgKXeH4p5_Bwai0nQ_d-NWdOk_'

source = source.replace(
  /const SUPABASE_KEY = VITE_ENV\.VITE_SUPABASE_KEY \|\| '[^']+'/,
  `const SUPABASE_KEY = '${active}'`,
)

const oldBlock = `export async function signInWithEmail(email: string, password: string) {\n  const response = await fetch(\`${'${SUPABASE_URL}'}/auth/v1/token?grant_type=password\`, {\n    method: 'POST', headers: headers(), body: JSON.stringify({ email, password }),\n  })\n  const payload = await readJson(response)\n  const session = sessionFromAuthPayload(payload)\n  if (!session) throw new Error('SESSION_NOT_RETURNED')\n  saveSession(session)\n  return session\n}`

const newBlock = `export async function signInWithEmail(email: string, password: string) {\n  const controller = new AbortController()\n  const timeout = window.setTimeout(() => controller.abort(), 12000)\n  try {\n    const response = await fetch(\`${'${SUPABASE_URL}'}/auth/v1/token?grant_type=password\`, {\n      method: 'POST', headers: headers(), body: JSON.stringify({ email, password }), signal: controller.signal,\n    })\n    const payload = await readJson(response)\n    const session = sessionFromAuthPayload(payload)\n    if (!session) throw new Error('SESSION_NOT_RETURNED')\n    saveSession(session)\n    return session\n  } catch (error) {\n    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('SIGN_IN_TIMEOUT')\n    throw error\n  } finally {\n    window.clearTimeout(timeout)\n  }\n}`

if (!source.includes(oldBlock)) throw new Error('signInWithEmail anchor not found')
source = source.replace(oldBlock, newBlock)
fs.writeFileSync(path, source)

const appPath = 'src/App.tsx'
let app = fs.readFileSync(appPath, 'utf8')

const startupOld = `        if (!profile?.fighter_handle) {\n          if (googleSession) setOnlineScreen('HANDLE')\n          return\n        }\n        const [leaders, match] = await Promise.all([getTop10Leaderboard(session), getMyActiveMatch(session)])\n        if (disposed) return\n        setLeaderboardRows(leaders)\n        if (match) {\n          if (googleSession) applyOnlineMatchView(match)\n          else {\n            latestMatchIdRef.current = match.id\n            latestMatchVersionRef.current = Number(match.state_version)\n            setActiveOnlineMatch(match)\n          }\n        } else if (googleSession) {\n          setOnlineScreen('LOBBY')\n        }`

const startupNew = `        if (!profile?.fighter_handle) {\n          setOnlineScreen('HANDLE')\n          return\n        }\n        const [leaders, match] = await Promise.all([getTop10Leaderboard(session), getMyActiveMatch(session)])\n        if (disposed) return\n        setLeaderboardRows(leaders)\n        if (match) {\n          applyOnlineMatchView(match)\n        } else {\n          setOnlineScreen('LOBBY')\n        }`

if (!app.includes(startupOld)) throw new Error('saved-session lobby transition anchor missing')
app = app.replace(startupOld, startupNew)

const submitOld = `      setOnlineSession(session)\n      const profile = await loadProfile(session)\n      setFighterProfile(profile)\n      if (profile?.fighter_handle) {\n        setLeaderboardRows(await getTop10Leaderboard(session))\n        setOnlineScreen('LOBBY')\n      } else setOnlineScreen('HANDLE')`

const submitNew = `      setOnlineSession(session)\n      const profile = await loadProfile(session)\n      setFighterProfile(profile)\n      if (profile?.fighter_handle) {\n        setOnlineScreen('LOBBY')\n        void getTop10Leaderboard(session).then(setLeaderboardRows).catch(() => undefined)\n      } else setOnlineScreen('HANDLE')`

if (!app.includes(submitOld)) throw new Error('email sign-in lobby transition anchor missing')
app = app.replace(submitOld, submitNew)
fs.writeFileSync(appPath, app)

console.log('Forced active auth key, added sign-in timeout, and fixed auth-to-Lobby transitions')
