import fs from 'node:fs'

const landing=fs.readFileSync('src/landing-ui.ts','utf8')
const guestEntry=fs.readFileSync('src/guest-practice-cta.ts','utf8')
const hud=fs.readFileSync('src/game/arena3d/Arena3DHUD.tsx','utf8')
const guestPatch=fs.readFileSync('scripts/patch-practice-guest-direct.mjs','utf8')

for(const marker of ["getSavedSession", "mega-x:start-practice-match", "findPlayNowButton()?.click()"]){
  if(!landing.includes(marker))throw new Error(`landing is missing guest-first routing marker: ${marker}`)
}
if(landing.includes("PRACTICE — PLAY AS GUEST"))throw new Error('landing must not present Practice as a separate guest choice')

for(const marker of ["SIGN IN", "mega-x:open-sign-in"]){
  if(!guestEntry.includes(marker))throw new Error(`guest landing sign-in entry missing: ${marker}`)
}
if(guestEntry.includes('PRACTICE — PLAY AS GUEST'))throw new Error('separate guest Practice CTA must be removed')

for(const marker of [
  'LEADERBOARD POINTS WERE NOT RECORDED',
  'SIGN IN',
  'PLAY AGAIN AS GUEST',
  'mega-x:open-sign-in',
  'mega-x:start-practice-match',
]){
  if(!hud.includes(marker))throw new Error(`3D guest result reminder missing: ${marker}`)
}

if(!guestPatch.includes("mega-x:open-sign-in"))throw new Error('App patch does not expose the sign-in event')
if(!guestPatch.includes("setOnlineScreen('AUTH')"))throw new Error('sign-in event does not open the existing auth screen')

console.log('GUEST_FIRST_LEADERBOARD_AUTH_PASS')
