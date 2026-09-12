import fs from 'node:fs'

const arenaPath = 'src/arena-blueprint.fragment'
const practicePath = 'src/practice-match.ts'
const appPath = 'src/App.tsx'
const lifecycleTestPath = 'tests/practice_real_exhaustion_lifecycle_regression.mjs'

let arena = fs.readFileSync(arenaPath, 'utf8')
let practice = fs.readFileSync(practicePath, 'utf8')
let app = fs.readFileSync(appPath, 'utf8')
let lifecycleTest = fs.readFileSync(lifecycleTestPath, 'utf8')

const from = "game.phase === 'EFFECT' && game.effectTurn === bottomPlayer"
const to = "game.phase === 'EFFECT' && (game.effectTurn === bottomPlayer || (activeOnlineMatch?.id?.startsWith('practice-local:') && activeOnlineMatch?.state?.effectTurn === onlineSession?.userId))"
const matches = arena.split(from).length - 1
if (matches < 2) throw new Error(`practice Effect-control patch expected at least 2 Arena targets, found ${matches}`)
arena = arena.split(from).join(to)

if (practice.includes('function advanceBot() {')) {
  practice = practice.replace('function advanceBot() {', 'function advanceBot(maxSteps = 24) {')
}
if (!practice.includes('function advanceBot(maxSteps = 24) {')) {
  throw new Error('practice pacing advanceBot signature target missing')
}
practice = practice.replace('    24,\n  )', '    maxSteps,\n  )')
if (!practice.includes('    maxSteps,\n  )')) throw new Error('practice pacing maxSteps target missing')

let submitReplacements = 0
practice = practice.replace(/\n  advanceBot\(\)\n  store\.match\.state_version \+= 1/g, () => {
  submitReplacements += 1
  return '\n  advanceBot(0)\n  store.match.state_version += 1'
})
if (submitReplacements !== 2) throw new Error(`practice pacing expected 2 submit advanceBot calls, found ${submitReplacements}`)

if (!practice.includes('export function tickPracticeBot')) {
  const insertBefore = 'export function surrenderPracticeMatch(userId: string, matchId: string) {'
  if (!practice.includes(insertBefore)) throw new Error('practice pacing tick insertion anchor missing')
  const tick = `export function tickPracticeBot(userId: string, matchId: string) {\n  if (!store || store.match.id !== matchId || store.match.player1_id !== userId) return null\n  if (store.match.state.phase === 'GAME_OVER' || store.match.state.phase === 'TIE_BREAKER') return null\n  const before = store.match.state\n  advanceBot(1)\n  if (store.match.state === before) return null\n  store.match.state_version += 1\n  return publicMatch()\n}\n\n`
  practice = practice.replace(insertBefore, tick + insertBefore)
}

if (!app.includes('tickPracticeBot')) {
  app = `import { tickPracticeBot } from './practice-match'\n` + app
}

if (!app.includes('mega-x:practice-bot-paced-turn')) {
  const hookAnchor = '  async function challengeFighter'
  if (!app.includes(hookAnchor)) throw new Error('practice pacing App hook anchor missing')
  const hook = `  useEffect(() => {\n    if (!onlineSession || !activeOnlineMatch?.id?.startsWith('practice-local:')) return\n    let cancelled = false\n    const phase = activeOnlineMatch.state?.phase\n    const baseDelay = phase === 'ATTACK' ? 1600 : phase === 'EFFECT' ? 1500 : 1300\n    const delay = baseDelay + Math.floor(Math.random() * 500)\n    const timer = window.setTimeout(() => {\n      if (cancelled) return\n      const next = tickPracticeBot(onlineSession.userId, activeOnlineMatch.id)\n      if (next && !cancelled) applyOnlineMatchView(next as any)\n    }, delay)\n    return () => { cancelled = true; window.clearTimeout(timer) }\n  // mega-x:practice-bot-paced-turn\n  }, [onlineSession?.userId, activeOnlineMatch?.id, activeOnlineMatch?.state_version])\n\n`
  app = app.replace(hookAnchor, hook + hookAnchor)
}

if (lifecycleTest.includes("import {\n  startPracticeMatch,\n  submitPracticeAction,\n} from '../src/practice-match.ts'")) {
  lifecycleTest = lifecycleTest.replace(
    "import {\n  startPracticeMatch,\n  submitPracticeAction,\n} from '../src/practice-match.ts'",
    "import {\n  startPracticeMatch,\n  submitPracticeAction,\n  tickPracticeBot,\n} from '../src/practice-match.ts'",
  )
}
if (!lifecycleTest.includes('const ticked = tickPracticeBot')) {
  const deadState = "  throw new Error(`Practice dead state before conclusion: phase=${s.phase} effectTurn=${s.effectTurn} attackTurn=${s.attackTurn} deck=${s.deckCount ?? s.deck?.length ?? 'hidden'} deckExhausted=${s.deckExhausted}`)"
  if (!lifecycleTest.includes(deadState)) throw new Error('practice pacing lifecycle regression anchor missing')
  lifecycleTest = lifecycleTest.replace(deadState, "  const ticked = tickPracticeBot(HUMAN, match.id)\n  if (ticked) { match = ticked; continue }\n\n" + deadState)
}

const oldFallbackCheck = `const arena = fs.readFileSync('src/arena-blueprint.fragment', 'utf8')
const fallback = "activeOnlineMatch?.id?.startsWith('practice-local:') && activeOnlineMatch?.state?.effectTurn === onlineSession?.userId"
if (!arena.includes(fallback)) {
  throw new Error('Practice human Effect turn has no direct Arena fallback; an exhausted match can show PEMAIN · EFFECT without TAMAT GILIRAN')
}`
const pacedCheck = `const practiceSource = fs.readFileSync('src/practice-match.ts', 'utf8')
const appSource = fs.readFileSync('src/App.tsx', 'utf8')
if (!practiceSource.includes('advanceBot(0)') || !practiceSource.includes('tickPracticeBot')) {
  throw new Error('Practice bot pacing driver is missing from the generated match runtime')
}
if (!appSource.includes('mega-x:practice-bot-paced-turn')) {
  throw new Error('Practice Arena is missing the paced bot turn scheduler')
}`
if (lifecycleTest.includes(oldFallbackCheck)) lifecycleTest = lifecycleTest.replace(oldFallbackCheck, pacedCheck)

fs.writeFileSync(arenaPath, arena)
fs.writeFileSync(practicePath, practice)
fs.writeFileSync(appPath, app)
fs.writeFileSync(lifecycleTestPath, lifecycleTest)
console.log(`Patched ${matches} Practice Effect-control Arena paths and paced Beginner Bot to one visible action every 1.3-2.1s`)
