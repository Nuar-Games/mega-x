import fs from 'node:fs'

const guestEntry=fs.readFileSync('src/guest-practice-cta.ts','utf8')
const arenaRuntime=fs.readFileSync('src/game/arena-next/ArenaNextRuntime.tsx','utf8')
const appSource=fs.readFileSync('src/App.tsx','utf8')

for(const marker of ['getSavedSession','mega-x:open-sign-in','mx-main-cta','SIGN IN']){
  if(!guestEntry.includes(marker))throw new Error(`guest-first landing route missing: ${marker}`)
}
if(guestEntry.includes("new CustomEvent('mega-x:enter-guest-lobby')"))throw new Error('signed-out MAIN SEKARANG must not enter the guest lobby')
if(guestEntry.includes("new CustomEvent('mega-x:start-practice-match')"))throw new Error('guest landing route still starts Practice directly')
if(guestEntry.includes('PRACTICE — PLAY AS GUEST'))throw new Error('separate guest Practice CTA must be removed')

for(const marker of [
  "identity.mode==='practice'",
  'LEADERBOARD POINTS WERE NOT RECORDED',
  'SIGN IN',
  'PLAY AGAIN AS GUEST',
  'mega-x:open-sign-in',
  'mega-x:start-practice-match',
]){
  if(!arenaRuntime.includes(marker))throw new Error(`arena-next guest result reminder missing: ${marker}`)
}

if(appSource.includes("addEventListener('mega-x:enter-guest-lobby'"))throw new Error('App source must not register a guest lobby listener')
if(!appSource.includes("setOnlineScreen('AUTH')"))throw new Error('sign-in event does not open the existing auth screen')

console.log('SIGN_IN_FIRST_LEADERBOARD_AUTH_PASS')
