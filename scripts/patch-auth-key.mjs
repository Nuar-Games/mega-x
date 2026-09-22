import fs from 'node:fs'

const path = 'src/onlineAuth.ts'
let source = fs.readFileSync(path, 'utf8')
const stale = 'sb_publishable_EMVTyrv3gGmmouCiVix4dg__W3zuzMc'
const active = 'sb_publishable_fXF7LXgKXeH4p5_Bwai0nQ_d-NWdOk_'
if (!source.includes(stale) && !source.includes(active)) throw new Error('Supabase publishable key marker not found')
source = source.replaceAll(stale, active)
fs.writeFileSync(path, source)
console.log('Patched Supabase publishable key')

// Signup already succeeds and saves the session. A manual refresh then enters the
// existing startup path and correctly shows Claim X Fighter Name. Automate that
// known-good refresh only for a successful SIGN_UP session; sign-in is untouched.
const appPath = 'src/App.tsx'
let app = fs.readFileSync(appPath, 'utf8')
const signupAnchor = `      setOnlineSession(session)\n      const profile = await loadProfile(session)`
if (!app.includes(signupAnchor)) throw new Error('signup auto-refresh anchor missing')
app = app.replace(
  signupAnchor,
  `      setOnlineSession(session)\n      if (authMode === 'SIGN_UP') {\n        window.location.reload()\n        return\n      }\n      const profile = await loadProfile(session)`,
)
fs.writeFileSync(appPath, app)
console.log('Added automatic refresh after successful email signup')
