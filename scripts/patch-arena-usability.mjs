import fs from 'node:fs'

const appPath = 'src/App.tsx'
const stagePath = 'src/arena-stage.css'
const usabilityCssPath = 'src/arena-usability.css'
let app = fs.readFileSync(appPath, 'utf8')
let stage = fs.readFileSync(stagePath, 'utf8')
let usabilityCss = fs.readFileSync(usabilityCssPath, 'utf8')

function mustReplace(source, from, to, label) {
  if (source.includes(to)) return source
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

const discardMarker = '/* Android-only premium discard selection tray */'
if (!usabilityCss.includes(discardMarker)) {
  usabilityCss += `\n${discardMarker}\n@media(max-width:560px){\n  .mx3-discard-selection-overlay{background:rgba(0,0,0,.74)!important;backdrop-filter:blur(5px)!important;-webkit-backdrop-filter:blur(5px)!important;padding:12px!important;box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important}\n  .mx3-target-selection-panel.mx3-discard-selection-panel{width:min(calc(100vw - 24px),430px)!important;height:min(calc(100dvh - 24px),780px)!important;max-height:calc(100dvh - 24px)!important;padding:0!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;border:2px solid rgba(218,181,78,.72)!important;border-radius:22px!important;background:linear-gradient(180deg,rgba(11,16,32,.985),rgba(4,7,17,.995))!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.04),0 20px 54px rgba(0,0,0,.68),0 0 28px rgba(218,181,78,.12)!important}\n  .mx3-discard-selection-panel .mx3-target-selection-title{position:relative!important;top:auto!important;flex:0 0 auto!important;margin:0!important;padding:18px 16px 40px!important;text-align:center!important;color:#f4d66f!important;background:linear-gradient(180deg,rgba(28,31,41,.98),rgba(10,14,26,.94))!important;border-bottom:1px solid rgba(218,181,78,.25)!important;font-size:clamp(24px,6.2vw,36px)!important;line-height:1!important;font-weight:1000!important;letter-spacing:.035em!important;text-shadow:0 2px 7px #000,0 0 16px rgba(240,199,72,.18)!important}\n  .mx3-discard-selection-panel .mx3-target-selection-title::after{content:attr(data-mx3-discard-summary)!important;position:absolute!important;left:10px!important;right:10px!important;bottom:12px!important;color:#f6f1de!important;font-size:14px!important;line-height:1!important;font-weight:850!important;letter-spacing:.025em!important;text-shadow:none!important}\n  .mx3-discard-selection-grid{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;align-content:start!important;padding:14px!important}\n  .mx3-discard-choice-item{position:relative!important;min-width:0!important;margin:0!important;padding:7px!important;border:1px solid rgba(218,181,78,.42)!important;border-radius:14px!important;background:linear-gradient(180deg,rgba(14,22,37,.94),rgba(6,10,20,.98))!important;box-shadow:0 8px 18px rgba(0,0,0,.42)!important;overflow:hidden!important;transition:transform .14s ease,border-color .14s ease,box-shadow .14s ease!important}\n  button.mx3-discard-choice-item{font-size:0!important;line-height:0!important}\n  .mx3-discard-choice-item:active{transform:scale(.985)!important}\n  .mx3-discard-choice-item img{display:block!important;width:100%!important;max-width:100%!important;height:auto!important;max-height:none!important;object-fit:contain!important;margin:0 auto!important}\n  .mx3-discard-choice-item .mx3-discard-pick-button{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;color:transparent!important;font-size:0!important;opacity:.001!important;z-index:8!important}\n  .mx3-discard-choice-item.is-selected{border-color:#ffd96f!important;box-shadow:inset 0 0 0 2px rgba(255,217,111,.18),0 0 20px rgba(255,93,61,.27),0 10px 24px rgba(0,0,0,.48)!important}\n  .mx3-discard-choice-item.is-selected::after{content:'✓ DIPILIH'!important;position:absolute!important;left:8px!important;right:8px!important;bottom:8px!important;z-index:7!important;height:32px!important;display:flex!important;align-items:center!important;justify-content:center!important;border:1px solid rgba(255,217,111,.6)!important;border-radius:8px!important;background:linear-gradient(180deg,rgba(116,22,34,.98),rgba(70,10,18,.98))!important;color:#ffe486!important;font-size:14px!important;line-height:1!important;font-weight:1000!important;letter-spacing:.055em!important;text-shadow:0 1px 3px #000!important}\n  .mx3-discard-selection-footer{position:sticky!important;bottom:0!important;z-index:12!important;flex:0 0 auto!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;padding:12px 14px max(14px,env(safe-area-inset-bottom))!important;background:rgba(6,9,19,.98)!important;border-top:1px solid rgba(218,181,78,.24)!important;box-shadow:0 -10px 22px rgba(0,0,0,.38)!important}\n  .mx3-discard-selection-footer .mx3-discard-action-button{min-width:0!important;min-height:50px!important;height:50px!important;margin:0!important;border-radius:11px!important;font-size:15px!important;font-weight:1000!important;letter-spacing:.04em!important}\n  .mx3-discard-selection-footer .mx3-discard-action-button:disabled{opacity:.42!important;filter:saturate(.45)!important;box-shadow:none!important}\n  .mx3-discard-selection-panel:not(:has(.mx3-discard-selection-grid)) .mx3-discard-choice-item{display:inline-block!important;width:calc(50% - 18px)!important;margin:8px!important;vertical-align:top!important}\n}\n`
}

if (!app.includes("mega-x:audio-toggle-request")) throw new Error('Arena usability audio request missing after patch')
if (!app.includes("mega-x:arena-feedback") || !app.includes('STA HABIS')) throw new Error('Arena usability STA feedback missing after patch')
if (stage.includes('#mx-audio-controls{display:none!important}')) throw new Error('Arena audio controls are still hidden')
if (!stage.includes('top:895px!important')) throw new Error('Arena hand spacing adjustment missing')
if (!usabilityCss.includes('Android-only premium discard selection tray') || !usabilityCss.includes('grid-template-columns:repeat(2,minmax(0,1fr))') || !usabilityCss.includes("content:'✓ DIPILIH'")) throw new Error('Premium Android discard tray styling missing')

fs.writeFileSync(appPath, app)
fs.writeFileSync(stagePath, stage)
fs.writeFileSync(usabilityCssPath, usabilityCss)
console.log('Applied Arena usability: working audio panel, lowered hand, premium Android discard tray, and exhausted-STA feedback')
