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

const startupPattern = /if \(!profile\?\.fighter_handle\) \{\s*if \(googleSession\) setOnlineScreen\('HANDLE'\)\s*return\s*\}\s*const \[leaders, match\] = await Promise\.all\(\[getTop10Leaderboard\(session\), getMyActiveMatch\(session\)\]\)\s*if \(disposed\) return\s*setLeaderboardRows\(leaders\)\s*if \(match\) \{\s*if \(googleSession\) applyOnlineMatchView\(match\)\s*else \{\s*latestMatchIdRef\.current = match\.id\s*latestMatchVersionRef\.current = Number\(match\.state_version\)\s*setActiveOnlineMatch\(match\)\s*\}\s*\} else if \(googleSession\) \{\s*setOnlineScreen\('LOBBY'\)\s*\}/

const startupNew = `if (!profile?.fighter_handle) {
          setOnlineScreen('HANDLE')
          return
        }
        const [leaders, match] = await Promise.all([getTop10Leaderboard(session), getMyActiveMatch(session)])
        if (disposed) return
        setLeaderboardRows(leaders)
        if (match) {
          applyOnlineMatchView(match)
        } else {
          setOnlineScreen('LOBBY')
        }`

if (!startupPattern.test(app)) throw new Error('saved-session lobby transition anchor missing')
app = app.replace(startupPattern, startupNew)

const submitPattern = /setOnlineSession\(session\)\s*const profile = await loadProfile\(session\)\s*setFighterProfile\(profile\)\s*if \(profile\?\.fighter_handle\) \{\s*setLeaderboardRows\(await getTop10Leaderboard\(session\)\)\s*setOnlineScreen\('LOBBY'\)\s*\} else setOnlineScreen\('HANDLE'\)/

const submitNew = `setOnlineSession(session)
      const profile = await loadProfile(session)
      setFighterProfile(profile)
      if (profile?.fighter_handle) {
        setOnlineScreen('LOBBY')
        void getTop10Leaderboard(session).then(setLeaderboardRows).catch(() => undefined)
      } else setOnlineScreen('HANDLE')`

if (!submitPattern.test(app)) throw new Error('email sign-in lobby transition anchor missing')
app = app.replace(submitPattern, submitNew)
fs.writeFileSync(appPath, app)

console.log('Forced active auth key, added sign-in timeout, and fixed auth-to-Lobby transitions')
