import fs from 'node:fs'

const appPath = 'src/App.tsx'
const arenaPath = 'src/arena-blueprint.fragment'
const cssPath = 'src/arena-stage.css'

let app = fs.readFileSync(appPath, 'utf8')
let arena = fs.readFileSync(arenaPath, 'utf8')
let css = fs.readFileSync(cssPath, 'utf8')

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

// VS-entry audio is owned only by src/audio.ts: direct pointerdown for local confirmation,
// plus its de-duplicated rendered-card fallback for opponent/non-click state changes.
// Do not emit ENTER_VS from App here; that caused the same sound to fire twice.
const event = "window.dispatchEvent(new CustomEvent('mega-x:motion', { detail: { kind: 'ENTER_VS' } }))"
for (const position of ['ATK', 'DEF']) {
  const duplicated = `setVS(bottomPlayer, focusedCard.id, '${position}'); ${event}; setFocusedCard(null)`
  const single = `setVS(bottomPlayer, focusedCard.id, '${position}'); setFocusedCard(null)`
  if (app.includes(duplicated)) app = app.replace(duplicated, single)
}
if (app.includes(`setVS(bottomPlayer, focusedCard.id, 'ATK'); ${event}`) || app.includes(`setVS(bottomPlayer, focusedCard.id, 'DEF'); ${event}`)) throw new Error('Duplicate App ENTER_VS dispatch survived')

if (!css.includes('background-position:200% 0') || !css.includes('@keyframes mx3VSTurnChase')) throw new Error('Android-safe VS chase light missing')

fs.writeFileSync(appPath, app)
fs.writeFileSync(arenaPath, arena)
fs.writeFileSync(cssPath, css)
console.log('Installed Android VS turn chase light; VS-entry audio remains single-authority in audio.ts')
