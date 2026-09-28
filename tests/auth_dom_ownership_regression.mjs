import fs from 'node:fs'

const app=fs.readFileSync('src/App.tsx','utf8')
const lobby=fs.readFileSync('src/lobby-ui.ts','utf8')
const root=fs.readFileSync('src/root.tsx','utf8')

if(app.includes('mx-auth-google'))throw new Error('React AUTH screen still renders the Google sign-in control')
if(lobby.includes('removeGoogleSignIn'))throw new Error('lobby UI still mutates the React-owned Google sign-in control')
for(const marker of [
  '<main key="landing" className="mx-online-screen mx-landing">',
  '<main key="auth" className="mx-online-screen mx-auth">',
  '<main key="handle" className="mx-online-screen mx-handle">',
  '<main key="lobby" className="mx-online-screen mx-lobby-shell">',
]){
  if(!app.includes(marker))throw new Error(`online screen is missing its distinct React key: ${marker}`)
}
if(root.includes("startPracticeMatch(session.userId,'GUEST X FIGHTER')"))throw new Error('signed-in Practice still hard-codes GUEST X FIGHTER')
if(!root.includes("loadProfile(session)")||!root.includes("profile?.fighter_handle||'GUEST X FIGHTER'"))throw new Error('Practice route does not use signed-in fighter handle with guest fallback')
console.log('AUTH_DOM_OWNERSHIP_REGRESSION_PASS')
