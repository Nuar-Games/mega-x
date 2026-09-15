import fs from 'node:fs'

const path='src/App.tsx'
let app=fs.readFileSync(path,'utf8')

const from=`    const startPractice = () => {\n      if (!onlineSession) return\n      const match = startPracticeMatch(onlineSession.userId, fighterProfile?.fighter_handle || 'X FIGHTER')\n      applyOnlineMatchView(match as any)\n    }`

const to=`    const startPractice = () => {\n      const guestKey = 'mega-x-practice-guest-id-v1'\n      let guestId = window.localStorage.getItem(guestKey)\n      if (!guestId) {\n        guestId = 'practice-guest:' + crypto.randomUUID()\n        window.localStorage.setItem(guestKey, guestId)\n      }\n      const practiceSession = onlineSession ?? {\n        accessToken: 'practice-local',\n        refreshToken: 'practice-local',\n        expiresAt: Number.MAX_SAFE_INTEGER,\n        userId: guestId,\n      }\n      if (!onlineSession) setOnlineSession(practiceSession)\n      const match = startPracticeMatch(practiceSession.userId, fighterProfile?.fighter_handle || 'GUEST X FIGHTER')\n      applyOnlineMatchView(match as any)\n    }`

if(!app.includes(from)) throw new Error('Practice guest-entry anchor missing')
app=app.replace(from,to)
fs.writeFileSync(path,app)
console.log('Patched Practice entry to allow local guest play before authentication')
