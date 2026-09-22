import fs from 'node:fs'

const appPath = 'src/App.tsx'
let app = fs.readFileSync(appPath, 'utf8')

const anchor = `      setOnlineSession(session)\n      const profile = await loadProfile(session)`
if (!app.includes(anchor)) throw new Error('signup auto-refresh anchor missing')

app = app.replace(
  anchor,
  `      setOnlineSession(session)\n      if (authMode === 'SIGN_UP') {\n        window.location.reload()\n        return\n      }\n      const profile = await loadProfile(session)`,
)

if (!app.includes("if (authMode === 'SIGN_UP')")) throw new Error('signup auto-refresh condition missing')
if (!app.includes('window.location.reload()')) throw new Error('signup auto-refresh action missing')

fs.writeFileSync(appPath, app)
console.log('Added automatic refresh after successful email signup')
