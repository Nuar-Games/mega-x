import fs from 'node:fs'

const cssPath = 'src/Online.css'
let css = fs.readFileSync(cssPath, 'utf8')

const marker = '/* Leaderboard identity spacing */'
if (!css.includes(marker)) {
  css += `\n${marker}\n.mx-rank-card b+span,.mx-rank-card strong+span,.mx-rank-card span+strong{margin-left:.45rem!important}.mx-rank-card{column-gap:.45rem!important}\n`
}
fs.writeFileSync(cssPath, css)
console.log('Applied leaderboard username/PTS spacing')

const appPath = 'src/App.tsx'
let app = fs.readFileSync(appPath, 'utf8')

app = app.replace(
  /if \(!profile\?\.fighter_handle\) \{\s*if \(googleSession\) setOnlineScreen\('HANDLE'\)\s*return\s*\}/,
  "if (!profile?.fighter_handle) {\n        setOnlineScreen('HANDLE')\n        return\n      }",
)

app = app.replace(
  /\} else if \(googleSession\) \{\s*setOnlineScreen\('LOBBY'\)\s*\}/,
  "} else {\n        setOnlineScreen('LOBBY')\n      }",
)

const screenStatePattern = /useState<OnlineScreen>\('LANDING'\)/
if (!screenStatePattern.test(app)) throw new Error('onlineScreen initial state anchor missing')
app = app.replace(
  screenStatePattern,
  "useState<OnlineScreen>(() => { try { return sessionStorage.getItem('mx-enter-lobby-after-auth') === '1' ? 'LOBBY' : 'LANDING' } catch { return 'LANDING' } })",
)

const startNeedle = 'async function submitEmailAuth()'
const endNeedle = 'async function submitFighterHandle()'
const start = app.indexOf(startNeedle)
const end = app.indexOf(endNeedle, start + startNeedle.length)
if (start < 0 || end < 0 || end <= start) throw new Error('final email auth function boundaries missing')

const replacement = `async function submitEmailAuth() {
    if (!authEmail || authPassword.length < 6 || onlineBusy) return
    setOnlineBusy(true)
    setOnlineMessage('')
    try {
      const session = authMode === 'SIGN_IN'
        ? await signInWithEmail(authEmail, authPassword)
        : (await signUpWithEmail(authEmail, authPassword)).session
      if (!session) {
        setOnlineMessage('CHECK YOUR EMAIL TO CONFIRM YOUR ACCOUNT.')
        return
      }
      setOnlineSession(session)
      const profile = await loadProfile(session)
      setFighterProfile(profile)
      if (profile?.fighter_handle) {
        try { sessionStorage.setItem('mx-enter-lobby-after-auth', '1') } catch {}
        window.location.reload()
        return
      }
      setOnlineBusy(false)
      setOnlineScreen('HANDLE')
    } catch (error) {
      setOnlineMessage(error instanceof Error ? error.message.replaceAll('_', ' ') : 'SIGN IN FAILED')
    } finally {
      setOnlineBusy(false)
    }
  }
  `

app = app.slice(0, start) + replacement + app.slice(end)

const restoreAnchor = "setFighterProfile(profile)"
const restoreIndex = app.indexOf(restoreAnchor)
if (restoreIndex < 0) throw new Error('saved-session restore anchor missing')
const insertAt = restoreIndex + restoreAnchor.length
app = app.slice(0, insertAt) + `\n      try {\n        if (sessionStorage.getItem('mx-enter-lobby-after-auth') === '1' && profile?.fighter_handle) {\n          sessionStorage.removeItem('mx-enter-lobby-after-auth')\n          setOnlineBusy(false)\n          setOnlineScreen('LOBBY')\n          void getTop10Leaderboard(session).then(setLeaderboardRows).catch(() => undefined)\n          return\n        }\n      } catch {}` + app.slice(insertAt)

fs.writeFileSync(appPath, app)

const finalApp = fs.readFileSync(appPath, 'utf8')
console.log('FINAL_EMAIL_AUTH_HARD_NAV=' + finalApp.includes("sessionStorage.setItem('mx-enter-lobby-after-auth', '1')"))
console.log('FINAL_RESTORE_FORCED_LOBBY=' + finalApp.includes("sessionStorage.getItem('mx-enter-lobby-after-auth') === '1'"))
console.log('FINAL_FIRST_PAINT_LOBBY=' + finalApp.includes("return sessionStorage.getItem('mx-enter-lobby-after-auth') === '1' ? 'LOBBY' : 'LANDING'"))
