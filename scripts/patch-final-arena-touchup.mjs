import fs from 'node:fs'

const appPath = 'src/App.tsx'
const arenaPath = 'src/arena-blueprint.fragment'
const cssPath = 'src/arena-stage.css'
const stagePath = 'src/arena-stage.ts'

let app = fs.readFileSync(appPath, 'utf8')
let arena = fs.readFileSync(arenaPath, 'utf8')
let css = fs.readFileSync(cssPath, 'utf8')
let stage = fs.readFileSync(stagePath, 'utf8')

function installTurnClass(source) {
  const p1Old = "mx3-vs mx3-vs-left ${(game.phase === 'SET_VS' && game.needsVS[0]) || (game.phase === 'ATTACK' && game.attackTurn === 0) ? 'is-live' : ''}"
  const p1New = "mx3-vs mx3-vs-left ${activePlayer === 0 ? 'is-turn-active' : ''} ${(game.phase === 'SET_VS' && game.needsVS[0]) || (game.phase === 'ATTACK' && game.attackTurn === 0) ? 'is-live' : ''}"
  const p2Old = "mx3-vs mx3-vs-right ${(game.phase === 'SET_VS' && game.needsVS[1]) || (game.phase === 'ATTACK' && game.attackTurn === 1) ? 'is-live' : ''}"
  const p2New = "mx3-vs mx3-vs-right ${activePlayer === 1 ? 'is-turn-active' : ''} ${(game.phase === 'SET_VS' && game.needsVS[1]) || (game.phase === 'ATTACK' && game.attackTurn === 1) ? 'is-live' : ''}"
  if (source.includes(p1Old)) source = source.replace(p1Old, p1New)
  if (source.includes(p2Old)) source = source.replace(p2Old, p2New)
  return source
}

arena = installTurnClass(arena)
app = installTurnClass(app)
if (!app.includes("activePlayer === 0 ? 'is-turn-active' : ''") || !app.includes("activePlayer === 1 ? 'is-turn-active' : ''")) throw new Error('Final rendered App is missing VS turn-owner classes')

// Android-safe chasing edge: animate ordinary background positions; no @property, mask-composite, or color-mix dependency.
const oldMarker = '/* Final Arena turn-owner VS chase light */'
const markerAt = css.indexOf(oldMarker)
if (markerAt >= 0) css = css.slice(0, markerAt)
css += `\n${oldMarker}\n.mx3-vs.is-turn-active{box-shadow:inset 0 0 0 3px rgba(255,244,170,.20),0 0 20px rgba(255,234,112,.48),0 0 38px rgba(255,225,70,.26)!important}\n.mx3-vs.is-turn-active::after{content:'';position:absolute;inset:-6px;z-index:30;pointer-events:none;background:linear-gradient(90deg,transparent 0 34%,#fff8c9 47%,#fff 50%,#fff8c9 53%,transparent 66%) top left/220% 4px no-repeat,linear-gradient(180deg,transparent 0 34%,#fff8c9 47%,#fff 50%,#fff8c9 53%,transparent 66%) top right/4px 220% no-repeat,linear-gradient(270deg,transparent 0 34%,#fff8c9 47%,#fff 50%,#fff8c9 53%,transparent 66%) bottom right/220% 4px no-repeat,linear-gradient(0deg,transparent 0 34%,#fff8c9 47%,#fff 50%,#fff8c9 53%,transparent 66%) bottom left/4px 220% no-repeat;filter:drop-shadow(0 0 5px #ffe45d) drop-shadow(0 0 10px #ffc72f);animation:mx3VSTurnChase .72s linear infinite!important}\n.mx3-vs-left.is-turn-active::after{filter:drop-shadow(0 0 5px #8beaff) drop-shadow(0 0 11px #38cfff)}\n.mx3-vs-right.is-turn-active::after{filter:drop-shadow(0 0 5px #ff9bb0) drop-shadow(0 0 11px #ff496d)}\n@keyframes mx3VSTurnChase{0%{background-position:200% 0,100% 200%, -100% 100%,0 -100%}100%{background-position:-100% 0,100% -100%,200% 100%,0 200%}}\n@media(prefers-reduced-motion:reduce){.mx3-vs.is-turn-active::after{animation-duration:1.8s!important}}\n`

// Fire the VS-entry SFX from the actual ATK/DEF confirmation gesture, where Android audio permission is definitely active.
const event = "window.dispatchEvent(new CustomEvent('mega-x:motion', { detail: { kind: 'ENTER_VS' } }))"
for (const position of ['ATK', 'DEF']) {
  const oldClick = `setVS(bottomPlayer, focusedCard.id, '${position}'); setFocusedCard(null)`
  const newClick = `setVS(bottomPlayer, focusedCard.id, '${position}'); ${event}; setFocusedCard(null)`
  if (app.includes(oldClick)) app = app.replace(oldClick, newClick)
}
if (!app.includes(`setVS(bottomPlayer, focusedCard.id, 'ATK'); ${event}`) || !app.includes(`setVS(bottomPlayer, focusedCard.id, 'DEF'); ${event}`)) throw new Error('Final rendered App is missing direct VS-entry sound dispatch')

// Keep rendered-state identity fallback for opponent VS entry and non-click state changes.
if (!stage.includes('const previousVsCardIds: [string | null, string | null]')) {
  const anchor = 'const previousDeckCounts = new WeakMap<Element, string>()\n'
  if (!stage.includes(anchor)) throw new Error('Arena stage state anchor missing')
  stage = stage.replace(anchor, `${anchor}const previousVsCardIds: [string | null, string | null] = [null, null]\n`)
}
if (!stage.includes('function syncVsEntrySound(shell: HTMLElement)')) {
  const anchor = 'function fitCanvas(shell: HTMLElement) {'
  if (!stage.includes(anchor)) throw new Error('Arena stage fitCanvas anchor missing')
  const fn = `function syncVsEntrySound(shell: HTMLElement) {\n  const selectors = ['.mx3-vs-left', '.mx3-vs-right'] as const\n  selectors.forEach((selector, index) => {\n    const zone = shell.querySelector<HTMLElement>(selector)\n    if (!zone) return\n    const cardId = zone.dataset.vsCardId || ''\n    const previous = previousVsCardIds[index]\n    if (previous === null) { previousVsCardIds[index] = cardId; return }\n    if (cardId && cardId !== previous) window.dispatchEvent(new CustomEvent('mega-x:motion', { detail: { kind: 'ENTER_VS' } }))\n    previousVsCardIds[index] = cardId\n  })\n}\n\n`
  stage = stage.replace(anchor, fn + anchor)
}
if (!stage.includes('syncVsEntrySound(shell)')) {
  const anchor = '  refreshFeedback(shell)\n'
  if (!stage.includes(anchor)) throw new Error('Arena stage mount feedback anchor missing')
  stage = stage.replace(anchor, `${anchor}  syncVsEntrySound(shell)\n`)
}

if (!css.includes('background-position:200% 0') || !css.includes('@keyframes mx3VSTurnChase')) throw new Error('Android-safe VS chase light missing')

fs.writeFileSync(appPath, app)
fs.writeFileSync(arenaPath, arena)
fs.writeFileSync(cssPath, css)
fs.writeFileSync(stagePath, stage)
console.log('Installed Android-authoritative VS turn chase light and direct VS-entry sound dispatch')
