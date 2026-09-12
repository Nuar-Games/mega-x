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

if (!source.includes('export async function requestPasswordReset')) {
  const googleAnchor = 'export function signInWithGoogle() {'
  if (!source.includes(googleAnchor)) throw new Error('Google sign-in anchor missing for recovery helpers')
  const recoveryHelpers = `export async function requestPasswordReset(email: string): Promise<void> {\n  const cleanEmail = email.trim()\n  if (!cleanEmail) throw new Error('EMAIL_REQUIRED')\n  const redirectTo = encodeURIComponent(\`${'${location.origin}'}/reset-password.html\`)\n  const response = await fetch(\`${'${SUPABASE_URL}'}/auth/v1/recover?redirect_to=${'${redirectTo}'}\`, {\n    method: 'POST', headers: headers(), body: JSON.stringify({ email: cleanEmail }),\n  })\n  await readJson(response)\n}\n\nexport function consumeRecoverySessionFromHash(): OnlineSession | null {\n  if (!location.hash.includes('access_token=')) return null\n  const params = new URLSearchParams(location.hash.slice(1))\n  if (params.get('type') !== 'recovery') return null\n  const accessToken = params.get('access_token')\n  const refreshToken = params.get('refresh_token')\n  if (!accessToken || !refreshToken) return null\n  const tokenPayload = JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))\n  const session: OnlineSession = {\n    accessToken,\n    refreshToken,\n    expiresAt: Date.now() + Number(params.get('expires_in') || 3600) * 1000,\n    userId: String(tokenPayload.sub),\n    email: tokenPayload.email,\n  }\n  history.replaceState(null, '', location.pathname + location.search)\n  saveSession(session)\n  return session\n}\n\nexport async function updatePassword(session: OnlineSession, password: string): Promise<void> {\n  if (password.length < 8) throw new Error('PASSWORD_TOO_SHORT')\n  const response = await fetch(\`${'${SUPABASE_URL}'}/auth/v1/user\`, {\n    method: 'PUT', headers: headers(session.accessToken), body: JSON.stringify({ password }),\n  })\n  await readJson(response)\n}\n\n`
  source = source.replace(googleAnchor, recoveryHelpers + googleAnchor)
}

const googleHashAnchor = `export function consumeGoogleSessionFromHash(): OnlineSession | null {\n  if (!location.hash.includes('access_token=')) return null`
if (!source.includes(googleHashAnchor)) throw new Error('Google hash consumer anchor missing')
source = source.replace(
  googleHashAnchor,
  `export function consumeGoogleSessionFromHash(): OnlineSession | null {\n  if (location.hash.includes('type=recovery')) return null\n  if (!location.hash.includes('access_token=')) return null`,
)

fs.writeFileSync(path, source)

const appPath = 'src/App.tsx'
const onlineCssPath = 'src/Online.css'
let app = fs.readFileSync(appPath, 'utf8')
let onlineCss = fs.readFileSync(onlineCssPath, 'utf8')

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

if (!app.includes('FORGOT PASSWORD?')) {
  if (!app.includes('requestPasswordReset')) app = `import { requestPasswordReset } from './onlineAuth'\n` + app
  const passwordInput = `<input type="password" autoComplete={authMode === 'SIGN_IN' ? 'current-password' : 'new-password'} placeholder="PASSWORD" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitEmailAuth()} />`
  if (!app.includes(passwordInput)) throw new Error('AUTH password input anchor missing for password recovery')
  const forgotButton = `${passwordInput}\n            {authMode === 'SIGN_IN' && <button type="button" className="mx-auth-forgot" onClick={async () => {\n              if (!authEmail.trim()) { setOnlineMessage('ENTER YOUR EMAIL FIRST'); return }\n              try {\n                await requestPasswordReset(authEmail.trim())\n                setOnlineMessage('PASSWORD RESET EMAIL SENT')\n              } catch (error) {\n                setOnlineMessage(error instanceof Error ? error.message.replaceAll('_', ' ') : 'PASSWORD RESET FAILED')\n              }\n            }}>FORGOT PASSWORD?</button>}`
  app = app.replace(passwordInput, forgotButton)
}

// Resume-match branding is scoped to the existing RESUME MATCH screen only.
const resumeAnchor = app.indexOf('RESUME MATCH')
if (resumeAnchor < 0) throw new Error('resume-match screen anchor missing')
const resumeStart = Math.max(0, resumeAnchor - 6000)
const resumeEnd = Math.min(app.length, resumeAnchor + 6000)
let resumeBlock = app.slice(resumeStart, resumeEnd)

const subtitlePattern = /<([a-z][a-z0-9]*)\b[^>]*>\s*[^<]*ENTER\s+THE\s+ARENA[^<]*<\/\1>/i
if (!subtitlePattern.test(resumeBlock)) throw new Error('resume-match ENTER THE ARENA subtitle missing')
resumeBlock = resumeBlock.replace(subtitlePattern, '')

const textLogoPattern = /<(h1|h2|div|span)\b[^>]*>\s*MEGA\s*-\s*X\s*<\/\1>/i
if (!textLogoPattern.test(resumeBlock)) throw new Error('resume-match MEGA - X text logo missing')
resumeBlock = resumeBlock.replace(textLogoPattern, '<img className="mx-resume-official-logo" src="/ui/landing/logo.avif" alt="MEGA-X" />')

if (/ENTER\s+THE\s+ARENA/i.test(resumeBlock)) throw new Error('resume-match subtitle survived removal')
if (!resumeBlock.includes('className="mx-resume-official-logo"') || !resumeBlock.includes('src="/ui/landing/logo.avif"')) throw new Error('official resume-match logo replacement missing')
app = app.slice(0, resumeStart) + resumeBlock + app.slice(resumeEnd)

const resumeBrandMarker = '/* Resume match official MEGA-X branding */'
if (!onlineCss.includes(resumeBrandMarker)) {
  onlineCss += `\n${resumeBrandMarker}\n.mx-resume-official-logo{display:block!important;width:min(560px,84vw)!important;max-width:84vw!important;height:auto!important;margin:0 auto clamp(18px,3vh,32px)!important;object-fit:contain!important;filter:drop-shadow(0 8px 18px rgba(0,0,0,.6)) drop-shadow(0 0 20px rgba(255,223,126,.22))!important}\n@media(max-width:560px){.mx-resume-official-logo{width:min(430px,88vw)!important;max-width:88vw!important;margin-bottom:18px!important}}\n`
}

if (!onlineCss.includes('/* Password recovery action */')) {
  onlineCss += `\n/* Password recovery action */\n.mx-auth-forgot{background:transparent!important;border:0!important;color:rgba(255,255,255,.72)!important;text-decoration:underline!important;font-size:12px!important;letter-spacing:.08em!important;margin-top:8px!important;cursor:pointer!important}\n.mx-auth-forgot:hover{color:#fff!important}\n`
}

if (!source.includes('requestPasswordReset') || !source.includes('consumeRecoverySessionFromHash') || !source.includes('updatePassword') || !app.includes('FORGOT PASSWORD?')) throw new Error('password recovery patch incomplete')
fs.writeFileSync(appPath, app)
fs.writeFileSync(onlineCssPath, onlineCss)

console.log('Forced active auth key, fixed auth-to-Lobby transitions, added password recovery, and applied official resume-match branding')
