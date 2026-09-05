import fs from 'node:fs'

const appPath = 'src/App.tsx'
let app = fs.readFileSync(appPath, 'utf8')

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

if (!app.includes("mega-x:audio-toggle-request")) throw new Error('Arena usability audio request missing after patch')
if (!app.includes("mega-x:arena-feedback") || !app.includes('STA HABIS')) throw new Error('Arena usability STA feedback missing after patch')

fs.writeFileSync(appPath, app)
console.log('Applied Arena usability: audio settings request and explicit exhausted-STA feedback')
