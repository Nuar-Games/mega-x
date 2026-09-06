import fs from 'node:fs'

const arenaPath = 'src/arena-blueprint.fragment'
const cssPath = 'src/arena-stage.css'
const stagePath = 'src/arena-stage.ts'

let arena = fs.readFileSync(arenaPath, 'utf8')
let css = fs.readFileSync(cssPath, 'utf8')
let stage = fs.readFileSync(stagePath, 'utf8')

// One authoritative turn indicator: the current player's VS frame owns the chase light.
const p1Old = "mx3-vs mx3-vs-left ${(game.phase === 'SET_VS' && game.needsVS[0]) || (game.phase === 'ATTACK' && game.attackTurn === 0) ? 'is-live' : ''}"
const p1New = "mx3-vs mx3-vs-left ${activePlayer === 0 ? 'is-turn-active' : ''} ${(game.phase === 'SET_VS' && game.needsVS[0]) || (game.phase === 'ATTACK' && game.attackTurn === 0) ? 'is-live' : ''}"
const p2Old = "mx3-vs mx3-vs-right ${(game.phase === 'SET_VS' && game.needsVS[1]) || (game.phase === 'ATTACK' && game.attackTurn === 1) ? 'is-live' : ''}"
const p2New = "mx3-vs mx3-vs-right ${activePlayer === 1 ? 'is-turn-active' : ''} ${(game.phase === 'SET_VS' && game.needsVS[1]) || (game.phase === 'ATTACK' && game.attackTurn === 1) ? 'is-live' : ''}"

if (arena.includes(p1Old)) arena = arena.replace(p1Old, p1New)
else if (!arena.includes("activePlayer === 0 ? 'is-turn-active' : ''")) throw new Error('P1 VS turn-light anchor missing')
if (arena.includes(p2Old)) arena = arena.replace(p2Old, p2New)
else if (!arena.includes("activePlayer === 1 ? 'is-turn-active' : ''")) throw new Error('P2 VS turn-light anchor missing')

const cssMarker = '/* Final Arena turn-owner VS chase light */'
if (!css.includes(cssMarker)) {
  css += `\n${cssMarker}\n@property --mx3-turn-angle{syntax:'<angle>';inherits:false;initial-value:0deg}\n.mx3-vs.is-turn-active{--mx3-turn-color:#fff29a;box-shadow:inset 0 0 0 3px rgba(255,244,170,.19),0 0 18px rgba(255,231,100,.38),0 0 34px rgba(255,226,85,.20)!important}\n.mx3-vs-left.is-turn-active{--mx3-turn-color:#7ee9ff}\n.mx3-vs-right.is-turn-active{--mx3-turn-color:#ff8ba4}\n.mx3-vs.is-turn-active::after{content:'';position:absolute;inset:-7px;z-index:7;pointer-events:none;padding:4px;clip-path:polygon(9px 0,calc(100% - 9px) 0,100% 9px,100% calc(100% - 9px),calc(100% - 9px) 100%,9px 100%,0 calc(100% - 9px),0 9px);background:conic-gradient(from var(--mx3-turn-angle),transparent 0deg 225deg,color-mix(in srgb,var(--mx3-turn-color) 45%,transparent) 252deg,var(--mx3-turn-color) 274deg,#fff 286deg,var(--mx3-turn-color) 298deg,color-mix(in srgb,var(--mx3-turn-color) 45%,transparent) 320deg,transparent 344deg 360deg);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;filter:drop-shadow(0 0 5px var(--mx3-turn-color)) drop-shadow(0 0 11px var(--mx3-turn-color));animation:mx3VSTurnChase .9s linear infinite!important}\n@keyframes mx3VSTurnChase{to{--mx3-turn-angle:360deg}}\n@media(prefers-reduced-motion:reduce){.mx3-vs.is-turn-active::after{animation-duration:2.4s!important}}\n`
}

// VS-entry sound is tied to the authoritative rendered VS card identity, not a fragile click path.
if (!stage.includes('const previousVsCardIds: [string | null, string | null]')) {
  const anchor = 'const previousDeckCounts = new WeakMap<Element, string>()\n'
  if (!stage.includes(anchor)) throw new Error('Arena stage state anchor missing')
  stage = stage.replace(anchor, `${anchor}const previousVsCardIds: [string | null, string | null] = [null, null]\n`)
}

if (!stage.includes('function syncVsEntrySound(shell: HTMLElement)')) {
  const anchor = 'function fitCanvas(shell: HTMLElement) {'
  if (!stage.includes(anchor)) throw new Error('Arena stage fitCanvas anchor missing')
  const fn = `function syncVsEntrySound(shell: HTMLElement) {\n  const selectors = ['.mx3-vs-left', '.mx3-vs-right'] as const\n  selectors.forEach((selector, index) => {\n    const zone = shell.querySelector<HTMLElement>(selector)\n    if (!zone) return\n    const cardId = zone.dataset.vsCardId || ''\n    const previous = previousVsCardIds[index]\n    if (previous === null) {\n      previousVsCardIds[index] = cardId\n      return\n    }\n    if (cardId && cardId !== previous) {\n      window.dispatchEvent(new CustomEvent('mega-x:motion', { detail: { kind: 'ENTER_VS' } }))\n    }\n    previousVsCardIds[index] = cardId\n  })\n}\n\n`
  stage = stage.replace(anchor, fn + anchor)
}

if (!stage.includes('syncVsEntrySound(shell)')) {
  const anchor = '  refreshFeedback(shell)\n'
  if (!stage.includes(anchor)) throw new Error('Arena stage mount feedback anchor missing')
  stage = stage.replace(anchor, `${anchor}  syncVsEntrySound(shell)\n`)
}

for (const required of [
  "activePlayer === 0 ? 'is-turn-active' : ''",
  "activePlayer === 1 ? 'is-turn-active' : ''",
]) if (!arena.includes(required)) throw new Error(`Arena turn light missing: ${required}`)
if (!css.includes('.mx3-vs.is-turn-active::after') || !css.includes('@keyframes mx3VSTurnChase')) throw new Error('VS chase-light CSS missing')
if (!stage.includes('previousVsCardIds') || !stage.includes("new CustomEvent('mega-x:motion', { detail: { kind: 'ENTER_VS' } })")) throw new Error('Rendered-state VS entry sound dispatch missing')

fs.writeFileSync(arenaPath, arena)
fs.writeFileSync(cssPath, css)
fs.writeFileSync(stagePath, stage)
console.log('Installed final Arena touch-up: authoritative VS turn chase light and rendered-state VS entry sound')
