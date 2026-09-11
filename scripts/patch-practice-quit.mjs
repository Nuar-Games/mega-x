import fs from 'node:fs'

const appPath = 'src/App.tsx'
const authPath = 'src/onlineAuth.ts'
let app = fs.readFileSync(appPath, 'utf8')
let auth = fs.readFileSync(authPath, 'utf8')

const appAnchor = '  async function challengeFighter'
if (!app.includes("mega-x:practice-exit")) {
  if (!app.includes(appAnchor)) throw new Error('practice quit app anchor missing')
  const hook = `  useEffect(() => {\n    const exitPractice = () => {\n      document.documentElement.classList.remove('mx-practice-active')\n      setActiveOnlineMatch(null)\n      setOnlineScreen('LOBBY')\n    }\n    window.addEventListener('mega-x:practice-exit', exitPractice)\n    return () => window.removeEventListener('mega-x:practice-exit', exitPractice)\n  }, [])\n\n`
  app = app.replace(appAnchor, hook + appAnchor)
}

const oldPracticeQuit = "  if (isPracticeMatchId(matchId)) { surrenderPracticeMatch(session.userId, matchId); return }"
const newPracticeQuit = "  if (isPracticeMatchId(matchId)) { clearPracticeMatch(session.userId, matchId); window.dispatchEvent(new CustomEvent('mega-x:practice-exit')); return }"
if (!auth.includes(newPracticeQuit)) {
  if (!auth.includes(oldPracticeQuit)) throw new Error('practice quit surrender route missing')
  auth = auth.replace(oldPracticeQuit, newPracticeQuit)
}

fs.writeFileSync(appPath, app)
fs.writeFileSync(authPath, auth)
console.log('Applied immediate Practice QUIT -> Lobby routing')
