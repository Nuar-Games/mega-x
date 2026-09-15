import fs from 'node:fs'

const app=fs.readFileSync('src/App.tsx','utf8')

if(!app.includes('mega-x:start-practice-match')) throw new Error('Practice event listener missing')
if(app.includes("if (!onlineSession) return\n      const match = startPracticeMatch")) throw new Error('Practice is still blocked by authentication')
if(!app.includes('practice-guest:')) throw new Error('Guest Practice identity missing')
if(!app.includes('setOnlineSession(practiceSession)')) throw new Error('Guest Practice session is not promoted into renderer session state')
if(!app.includes("startPracticeMatch(practiceSession.userId")) throw new Error('Guest Practice does not create the match directly from the active guest-or-authenticated session')
if(!app.includes('applyOnlineMatchView(match as any)')) throw new Error('Guest Practice does not open the created match immediately')
if(app.includes("window.setTimeout(() => window.dispatchEvent(new CustomEvent('mega-x:start-practice-match')), 0)")) throw new Error('Guest Practice still relies on fragile redispatch handoff')

console.log('PRACTICE_GUEST_ENTRY_PASS')
