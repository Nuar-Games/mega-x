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
        setOnlineBusy(false)
        setOnlineScreen('LOBBY')
        void getTop10Leaderboard(session).then(setLeaderboardRows).catch(() => undefined)
      } else {
        setOnlineBusy(false)
        setOnlineScreen('HANDLE')
      }
    } catch (error) {
      setOnlineMessage(error instanceof Error ? error.message.replaceAll('_', ' ') : 'SIGN IN FAILED')
    } finally {
      setOnlineBusy(false)
    }
  }
  `

app = app.slice(0, start) + replacement + app.slice(end)
fs.writeFileSync(appPath, app)

const finalApp = fs.readFileSync(appPath, 'utf8')
console.log('FINAL_EMAIL_AUTH_FAST_LOBBY=' + finalApp.includes("setOnlineBusy(false)\n        setOnlineScreen('LOBBY')"))
console.log('FINAL_SAVED_EMAIL_LOBBY=' + !finalApp.includes("else if (googleSession) {\n        setOnlineScreen('LOBBY')"))
