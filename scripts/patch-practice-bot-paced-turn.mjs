import fs from 'node:fs'

const path = 'src/App.tsx'
let app = fs.readFileSync(path, 'utf8')

if (!app.includes("import { startPracticeMatch, tickPracticeBot } from './practice-match'")) {
  const from = "import { startPracticeMatch } from './practice-match'"
  if (!app.includes(from)) throw new Error('Practice bot pacing import anchor missing')
  app = app.replace(from, "import { startPracticeMatch, tickPracticeBot } from './practice-match'")
}

if (!app.includes('// mega-x:practice-bot-paced-turn')) {
  const anchor = `  useEffect(() => {\n    const exitPractice = () => {`
  if (!app.includes(anchor)) throw new Error('Practice bot pacing effect anchor missing')
  const hook = `  useEffect(() => {\n    if (!onlineSession || !activeOnlineMatch?.id?.startsWith('practice-local:')) return\n    let cancelled = false\n    const phase = activeOnlineMatch.state?.phase\n    const baseDelay = phase === 'ATTACK' ? 1600 : phase === 'EFFECT' ? 1500 : 1300\n    const delay = baseDelay + Math.floor(Math.random() * 500)\n    const timer = window.setTimeout(() => {\n      if (cancelled) return\n      const next = tickPracticeBot(onlineSession.userId, activeOnlineMatch.id)\n      if (next && !cancelled) applyOnlineMatchView(next as any)\n    }, delay)\n    return () => { cancelled = true; window.clearTimeout(timer) }\n  // mega-x:practice-bot-paced-turn\n  }, [onlineSession?.userId, activeOnlineMatch?.id, activeOnlineMatch?.state_version])\n\n`
  app = app.replace(anchor, hook + anchor)
}

fs.writeFileSync(path, app)
console.log('Restored paced Practice bot UI hook')
