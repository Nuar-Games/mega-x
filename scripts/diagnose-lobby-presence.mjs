import fs from 'node:fs'
let app = fs.readFileSync('src/App.tsx','utf8')
for (const needle of ['heartbeatLobby(', 'getOnlineFighters(', "onlineScreen === 'LOBBY'", 'refreshLobby']) {
  let from = 0, n = 0
  while (true) {
    const i = app.indexOf(needle, from)
    if (i < 0) break
    n++
    console.log(`=== ${needle} #${n} @ ${i} ===`)
    console.log(app.slice(Math.max(0,i-900), Math.min(app.length,i+1800)))
    from = i + needle.length
  }
  if (!n) console.log(`=== ${needle}: NONE ===`)
}

// A successful email signup already saves the session. Manual refresh is known to
// enter the saved-session startup path and show Claim X Fighter Name correctly.
// Automate exactly that known-good step, without changing any screen/layout logic.
const signupAnchor = `      setOnlineSession(session)\n      const profile = await loadProfile(session)`
if (!app.includes(signupAnchor)) throw new Error('signup auto-refresh anchor missing after auth runtime patches')
app = app.replace(
  signupAnchor,
  `      setOnlineSession(session)\n      if (authMode === 'SIGN_UP') {\n        window.location.reload()\n        return\n      }\n      const profile = await loadProfile(session)`,
)
fs.writeFileSync('src/App.tsx', app)
console.log('Added automatic refresh after successful email signup')
