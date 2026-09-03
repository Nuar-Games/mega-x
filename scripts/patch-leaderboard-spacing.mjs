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

app = app.replace(
  /setOnlineSession\(session\)\s*const profile = await loadProfile\(session\)\s*setFighterProfile\(profile\)\s*if \(profile\?\.fighter_handle\) \{\s*setLeaderboardRows\(await getTop10Leaderboard\(session\)\)\s*setOnlineScreen\('LOBBY'\)\s*\} else setOnlineScreen\('HANDLE'\)/,
  "setOnlineSession(session)\n      const profile = await loadProfile(session)\n      setFighterProfile(profile)\n      if (profile?.fighter_handle) {\n        setOnlineBusy(false)\n        setOnlineScreen('LOBBY')\n        void getTop10Leaderboard(session).then(setLeaderboardRows).catch(() => undefined)\n      } else {\n        setOnlineBusy(false)\n        setOnlineScreen('HANDLE')\n      }",
)

fs.writeFileSync(appPath, app)

const finalApp = fs.readFileSync(appPath, 'utf8')
console.log('FINAL_EMAIL_AUTH_FAST_LOBBY=' + finalApp.includes("setOnlineBusy(false)\n        setOnlineScreen('LOBBY')"))
console.log('FINAL_SAVED_EMAIL_LOBBY=' + !finalApp.includes("else if (googleSession) {\n        setOnlineScreen('LOBBY')"))
