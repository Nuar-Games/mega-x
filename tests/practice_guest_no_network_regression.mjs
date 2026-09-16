import fs from 'node:fs'

const auth=fs.readFileSync('src/onlineAuth.ts','utf8')
for(const marker of [
  'isLocalPracticeSession',
  "session.accessToken === 'practice-local'",
  "fighter_handle: 'GUEST X FIGHTER'",
  'if (isLocalPracticeSession(session)) return []',
  'if (isLocalPracticeSession(session)) return null',
  'if (isLocalPracticeSession(session)) return',
]){
  if(!auth.includes(marker)) throw new Error(`missing guest no-network guard: ${marker}`)
}
console.log('PRACTICE_GUEST_NO_NETWORK_PASS')
