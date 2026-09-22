import fs from 'node:fs'

const appPath = 'src/App.tsx'
let app = fs.readFileSync(appPath, 'utf8')

const screenState = "const [onlineScreen, setOnlineScreen] = useState<'LANDING' | 'AUTH' | 'HANDLE' | 'LOBBY' | 'GAME'>"
if (!app.includes(screenState)) throw new Error('online screen state anchor missing')
app = app.replace(
  screenState,
  "const [onlineScreen, setOnlineScreen] = useState<'LANDING' | 'AUTH' | 'AUTH_CONFIRM' | 'HANDLE' | 'LOBBY' | 'GAME'>",
)

const noSessionBlock = `if (!session) {\n        setOnlineMessage('CHECK YOUR EMAIL TO CONFIRM YOUR ACCOUNT.')\n        return\n      }`
if (!app.includes(noSessionBlock)) throw new Error('signup no-session anchor missing')
app = app.replace(
  noSessionBlock,
  `if (!session) {\n        setOnlineMessage('')\n        setOnlineScreen('AUTH_CONFIRM')\n        return\n      }`,
)

const handleAnchor = `  if (onlineScreen === 'HANDLE') {`
if (!app.includes(handleAnchor)) throw new Error('HANDLE render anchor missing')

const confirmScreen = `  if (onlineScreen === 'AUTH_CONFIRM') {\n    return (\n      <main className="mx-online-screen mx-auth">\n        <section className="mx-auth-card" role="status" aria-live="polite">\n          <span>ACCOUNT CREATED</span>\n          <h1>CHECK YOUR EMAIL</h1>\n          <p>We sent a confirmation link to <strong>{authEmail}</strong>.</p>\n          <p>Open that email and confirm your account. MEGA-X will continue to your X Fighter setup when you return.</p>\n          <button className="mx-online-primary" onClick={() => { setAuthMode('SIGN_IN'); setAuthPassword(''); setOnlineMessage(''); setOnlineScreen('AUTH') }}>I'VE CONFIRMED — SIGN IN</button>\n          <button className="mx-back-link" onClick={() => setOnlineScreen('LANDING')}>BACK TO HOME</button>\n        </section>\n      </main>\n    )\n  }\n\n`
app = app.replace(handleAnchor, confirmScreen + handleAnchor)

if (!app.includes("onlineScreen === 'AUTH_CONFIRM'")) throw new Error('signup confirmation screen missing')
if (!app.includes("setOnlineScreen('AUTH_CONFIRM')")) throw new Error('signup confirmation transition missing')
if (!app.includes('ACCOUNT CREATED') || !app.includes('CHECK YOUR EMAIL')) throw new Error('signup confirmation copy missing')

fs.writeFileSync(appPath, app)
console.log('Added explicit signup confirmation screen')
