import fs from 'node:fs'

const app=fs.readFileSync('src/App.tsx','utf8')

if(!app.includes('mega-x:start-practice-match')) throw new Error('Practice event listener missing')
if(app.includes("if (!onlineSession) return\n      const match = startPracticeMatch")) throw new Error('Practice is still blocked by authentication')
if(!app.includes('practice-guest:')) throw new Error('Guest Practice identity missing')
if(!app.includes('setOnlineSession(practiceSession')) throw new Error('Guest Practice session is not promoted into renderer session state')
if(!app.includes("startPracticeMatch(practiceSession.userId")) throw new Error('Practice does not start from guest-or-authenticated session')

console.log('PRACTICE_GUEST_ENTRY_PASS')
