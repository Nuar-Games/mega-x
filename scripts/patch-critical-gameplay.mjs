import fs from 'node:fs'

const appPath = 'src/App.tsx'
const cssPath = 'src/V24.css'
let app = fs.readFileSync(appPath, 'utf8')
let css = fs.readFileSync(cssPath, 'utf8')

function replaceOnce(from, to, label) {
  if (!app.includes(from)) throw new Error(`critical patch target missing: ${label}`)
  app = app.replace(from, to)
}

// GRAVITIAN: only opponent VS/effects/hand return to Master Deck.
app = app.replace(
  "  // Tetapan semula pusingan GRAVITIAN.\n  clearEffectZones(game)\n  drawCards(game, target, 5, target)",
  "  // Tetapan semula pusingan GRAVITIAN. Effect pemilik kekal; hanya medan lawan dikembalikan.\n  drawCards(game, target, 5, target)",
)

// React state alone is not a synchronous click lock; rapid clicks can enter before rerender.
if (!app.includes('const matchNetworkBusyRef = useRef(false)')) {
  replaceOnce(
    "  const [matchNetworkBusy, setMatchNetworkBusy] = useState(false)",
    "  const [matchNetworkBusy, setMatchNetworkBusy] = useState(false)\n  const matchNetworkBusyRef = useRef(false)",
    'network busy ref',
  )
}

replaceOnce(
  "    if (!onlineSession || !activeOnlineMatch || matchNetworkBusy) return\n    setMatchNetworkBusy(true)\n    try {",
  "    if (!onlineSession || !activeOnlineMatch || matchNetworkBusyRef.current) return\n    matchNetworkBusyRef.current = true\n    setMatchNetworkBusy(true)\n    try {",
  'dispatch action lock',
)
replaceOnce(
  "    } finally {\n      setMatchNetworkBusy(false)\n    }\n  }\n\n  async function dispatchOnlineAttack()",
  "    } finally {\n      matchNetworkBusyRef.current = false\n      setMatchNetworkBusy(false)\n    }\n  }\n\n  async function dispatchOnlineAttack()",
  'dispatch action unlock',
)
replaceOnce(
  "    if (!onlineSession || !activeOnlineMatch || matchNetworkBusy) return\n    setMatchNetworkBusy(true)\n    try {\n      const result = await submitMatchEngineAction(onlineSession, activeOnlineMatch.id, activeOnlineMatch.state_version, 'ATTACK', {})",
  "    if (!onlineSession || !activeOnlineMatch || matchNetworkBusyRef.current) return\n    matchNetworkBusyRef.current = true\n    setMatchNetworkBusy(true)\n    try {\n      const result = await submitMatchEngineAction(onlineSession, activeOnlineMatch.id, activeOnlineMatch.state_version, 'ATTACK', {})",
  'attack lock',
)
replaceOnce(
  "    } finally { setMatchNetworkBusy(false) }",
  "    } finally { matchNetworkBusyRef.current = false; setMatchNetworkBusy(false) }",
  'attack unlock',
)

// Special visible Effect selection had the same rapid-click race.
app = app.replace(
  "      if (!matchNetworkBusy) {\n        setMatchNetworkBusy(true)\n        void submitMatchSpecialAction",
  "      if (!matchNetworkBusyRef.current) {\n        matchNetworkBusyRef.current = true\n        setMatchNetworkBusy(true)\n        void submitMatchSpecialAction",
)
app = app.replace(
  "          .finally(() => setMatchNetworkBusy(false))",
  "          .finally(() => { matchNetworkBusyRef.current = false; setMatchNetworkBusy(false) })",
)

// Remove the speculative queue added in the previous patch. It could create duplicate/janky
// travel because the authoritative state transition then generated a second movement.
app = app.replace(
  /  const optimisticMotionIdsRef = useRef<Set<number>>\(new Set\(\)\)\n/g,
  '',
)
app = app.replace(
  /\n      if \(optimisticMotionIdsRef\.current\.delete\(id\)\) continue\n/g,
  '\n',
)

const setVsStart = "    if (activeOnlineMatch) {\n      if (player === localViewer && !matchNetworkBusy) {\n        snapshotVisibleCardRects()"
if (app.includes(setVsStart)) {
  app = app.replace(
    /    if \(activeOnlineMatch\) \{\n      if \(player === localViewer && !matchNetworkBusy\) \{\n        snapshotVisibleCardRects\(\)[\s\S]*?        void dispatchOnlineAction\('SET_VS', \{ cardId, position \}\)\n      \}\n      return\n    \}/,
    "    if (activeOnlineMatch) { if (player === localViewer && !matchNetworkBusyRef.current) { snapshotVisibleCardRects(); window.dispatchEvent(new CustomEvent('mega-x:motion', { detail: { kind: 'ENTER_VS' } })); void dispatchOnlineAction('SET_VS', { cardId, position }); } return }",
  )
}
const effectStart = "    if (activeOnlineMatch) {\n      if (player === localViewer && !matchNetworkBusy) {\n        snapshotVisibleCardRects()"
if (app.includes(effectStart)) {
  app = app.replace(
    /    if \(activeOnlineMatch\) \{\n      if \(player === localViewer && !matchNetworkBusy\) \{\n        snapshotVisibleCardRects\(\)[\s\S]*?        void dispatchOnlineAction\('PLAY_EFFECT', \{ cardId \}\)\n      \}\n      return\n    \}/,
    "    if (activeOnlineMatch) { if (player === localViewer && !matchNetworkBusyRef.current) { snapshotVisibleCardRects(); void dispatchOnlineAction('PLAY_EFFECT', { cardId }); } return }",
  )
}

// Never scale X and Y independently. That was stretching card art during travel.
app = app.replace("    '--msx': sx,\n    '--msy': sy,", "    '--msx': s,\n    '--msy': s,")

const marker = '/* Critical gameplay motion guard */'
if (!css.includes(marker)) {
  css += `\n${marker}\n.duel-shell .motion-card-fx{background:transparent!important;overflow:visible!important}.duel-shell .motion-card-fx>.digital-card{aspect-ratio:420/595!important;object-fit:contain!important}.duel-shell .motion-card-fx.support{animation-duration:.72s!important}.duel-shell .motion-card-fx.enter_vs{animation-duration:.72s!important}\n`
}

fs.writeFileSync(appPath, app)
fs.writeFileSync(cssPath, css)
console.log('Applied critical gameplay fixes: Gravitian, click locks, explicit VS-entry audio, non-stretch card motion')
