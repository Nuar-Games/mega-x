import fs from 'node:fs'

const appPath = 'src/App.tsx'
const stagePath = 'src/arena-stage.css'
const usabilityCssPath = 'src/arena-usability.css'
let app = fs.readFileSync(appPath, 'utf8')
let stage = fs.readFileSync(stagePath, 'utf8')
let usabilityCss = fs.readFileSync(usabilityCssPath, 'utf8')

function mustReplace(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`Arena usability patch target missing: ${label}`)
  return source.replace(from, to)
}

app = mustReplace(
  app,
  `<button className="mx3-audio" type="button" onClick={() => document.querySelector<HTMLButtonElement>('#mx-audio-controls button')?.click()}>AUDIO</button>`,
  `<button className="mx3-audio" type="button" onClick={() => window.dispatchEvent(new CustomEvent('mega-x:audio-toggle-request'))}>AUDIO</button>`,
  'Arena audio button',
)

const handOld = `        const canEffect = game.phase === 'EFFECT' && game.effectTurn === bottomPlayer && !pendingChoice && passToPlayer === null\n        return <button key={card.id} className={\`mx3-hand-card \${arriving ? 'is-arrival-hidden' : ''} \${canSet || canEffect ? 'is-playable' : ''}\`} onClick={() => setFocusedCard(card)}><CardView card={card}/></button>`
const handNew = `        const canEffect = game.phase === 'EFFECT' && game.effectTurn === bottomPlayer && !pendingChoice && passToPlayer === null\n        const sta = Number((currentStats[bottomPlayer] as any)?.sta ?? 0)\n        const staEffectLimit = Math.max(0, sta - 1)\n        const staExhausted = canEffect && sta > 0 && game.players[bottomPlayer].effects.length >= staEffectLimit\n        return <button key={card.id} className={\`mx3-hand-card \${arriving ? 'is-arrival-hidden' : ''} \${canSet || canEffect ? 'is-playable' : ''} \${staExhausted ? 'is-sta-exhausted' : ''}\`} onClick={() => { if (staExhausted) { window.dispatchEvent(new CustomEvent('mega-x:arena-feedback', { detail: { message: \`STA HABIS — VS STA \${sta} hanya membenarkan \${staEffectLimit} kad EFFECT.\` } })); return } setFocusedCard(card) }}><CardView card={card}/></button>`
app = mustReplace(app, handOld, handNew, 'local hand exhausted-STA feedback')

const effectOld = `{game.players[bottomPlayer].hand.some((card) => card.id === focusedCard.id) && game.phase === 'EFFECT' && game.effectTurn === bottomPlayer && !pendingChoice && passToPlayer === null && <button type="button" onClick={() => { playEffect(bottomPlayer, focusedCard.id); setFocusedCard(null) }}>PLAY EFFECT</button>}`
const effectNew = `{game.players[bottomPlayer].hand.some((card) => card.id === focusedCard.id) && game.phase === 'EFFECT' && game.effectTurn === bottomPlayer && !pendingChoice && passToPlayer === null && (Number((currentStats[bottomPlayer] as any)?.sta ?? 0) > 0 && game.players[bottomPlayer].effects.length >= Math.max(0, Number((currentStats[bottomPlayer] as any)?.sta ?? 0) - 1) ? <button type="button" className="mx3-capacity-warning" onClick={() => window.dispatchEvent(new CustomEvent('mega-x:arena-feedback', { detail: { message: \`STA HABIS — VS STA \${Number((currentStats[bottomPlayer] as any)?.sta ?? 0)} hanya membenarkan \${Math.max(0, Number((currentStats[bottomPlayer] as any)?.sta ?? 0) - 1)} kad EFFECT.\` } }))}>STA HABIS</button> : <button type="button" onClick={() => { playEffect(bottomPlayer, focusedCard.id); setFocusedCard(null) }}>PLAY EFFECT</button>)}`
app = mustReplace(app, effectOld, effectNew, 'selected-card Effect capacity feedback')

stage = mustReplace(
  stage,
  'body.mx3-arena-present #mx-audio-controls{display:none!important}',
  `body.mx3-arena-present #mx-audio-controls{display:block!important;position:fixed!important;top:64px!important;right:10px!important;z-index:1600!important}\nbody.mx3-arena-present #mx-audio-controls>[data-audio-toggle]{display:none!important}\nbody.mx3-arena-present #mx-audio-controls [data-audio-panel][hidden]{display:none!important}\nbody.mx3-arena-present #mx-audio-controls [data-audio-panel]:not([hidden]){display:grid!important}`,
  'Arena audio controls visibility',
)

stage = mustReplace(
  stage,
  '.mx3-local-hand{position:absolute!important;left:180px!important;top:880px!important;',
  '.mx3-local-hand{position:absolute!important;left:180px!important;top:895px!important;',
  'local hand vertical spacing',
)

const discardMarker = '/* Android-only compact discard selection */'
if (!usabilityCss.includes(discardMarker)) {
  usabilityCss += `\n${discardMarker}\n@media(max-width:560px){\n  .mx3-target-selection-panel.mx3-discard-selection-panel button:has(img) img{\n    width:auto!important;\n    max-width:min(44vw,180px)!important;\n    max-height:24dvh!important;\n    object-fit:contain!important;\n  }\n}\n`
}

if (!app.includes("mega-x:audio-toggle-request")) throw new Error('Arena usability audio request missing after patch')
if (!app.includes("mega-x:arena-feedback") || !app.includes('STA HABIS')) throw new Error('Arena usability STA feedback missing after patch')
if (stage.includes('#mx-audio-controls{display:none!important}')) throw new Error('Arena audio controls are still hidden')
if (!stage.includes('top:895px!important')) throw new Error('Arena hand spacing adjustment missing')
if (!usabilityCss.includes('mx3-discard-selection-panel') || !usabilityCss.includes('max-height:24dvh!important')) throw new Error('Android discard compact sizing missing')

fs.writeFileSync(appPath, app)
fs.writeFileSync(stagePath, stage)
fs.writeFileSync(usabilityCssPath, usabilityCss)
console.log('Applied Arena usability: working audio panel, lowered hand, Android compact discard selection, and exhausted-STA feedback')
