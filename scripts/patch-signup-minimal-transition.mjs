import fs from 'node:fs'

const appPath = 'src/App.tsx'
let app = fs.readFileSync(appPath, 'utf8')

const anchor = `      setOnlineSession(session)\n      const profile = await loadProfile(session)`
if (!app.includes(anchor)) throw new Error('signup minimal transition anchor missing')

app = app.replace(
  anchor,
  `      setOnlineSession(session)\n      if (authMode === 'SIGN_UP') {\n        setFighterProfile(null)\n        setOnlineScreen('HANDLE')\n        return\n      }\n      const profile = await loadProfile(session)`,
)

const forbidden = ["'AUTH_CONFIRM'", "onlineScreen === 'AUTH_CONFIRM'", "setOnlineScreen('AUTH_CONFIRM')"]
for (const marker of forbidden) {
  if (app.includes(marker)) throw new Error(`signup minimal transition must not add screen state: ${marker}`)
}

if (!app.includes("if (authMode === 'SIGN_UP')")) throw new Error('signup minimal transition missing')
if (!app.includes("setOnlineScreen('HANDLE')")) throw new Error('signup HANDLE transition missing')

fs.writeFileSync(appPath, app)
console.log('Applied minimal signup-to-HANDLE transition without changing screen structure')
