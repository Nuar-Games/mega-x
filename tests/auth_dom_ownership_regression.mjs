import fs from 'node:fs'

const app=fs.readFileSync('src/App.tsx','utf8')
const lobby=fs.readFileSync('src/lobby-ui.ts','utf8')

if(app.includes('mx-auth-google'))throw new Error('React AUTH screen still renders the Google sign-in control')
if(lobby.includes('removeGoogleSignIn'))throw new Error('lobby UI still mutates the React-owned Google sign-in control')
console.log('AUTH_DOM_OWNERSHIP_REGRESSION_PASS')
