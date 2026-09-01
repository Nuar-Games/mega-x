import fs from 'node:fs'

const appPath = 'src/App.tsx'
const cssPath = 'src/V24.css'
let app = fs.readFileSync(appPath, 'utf8')
let css = fs.readFileSync(cssPath, 'utf8')

function mustReplace(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`arena audit patch target missing: ${label}`)
  return source.replace(from, to)
}

const oldConfirm = `  function confirmSelfDiscard() {\n    if (activeOnlineMatch) { void dispatchOnlineAction('RESOLVE_SELF_DISCARD', { cardIds: selectedDiscardIds }); return }\n    snapshotVisibleCardRects()\n    const pending = game.pendingSelfDiscard\n    if (!pending || pending.player !== localViewer) return\n    if (pending.mode === 'EXACT' && selectedDiscardIds.length !== pending.count) return`
const newConfirm = `  function confirmSelfDiscard() {\n    const pending = game.pendingSelfDiscard\n    if (!pending || pending.player !== localViewer) return\n    if (pending.mode === 'EXACT' && selectedDiscardIds.length !== pending.count) return\n    if (selectedDiscardIds.length === 0) return\n    if (activeOnlineMatch) { void dispatchOnlineAction('RESOLVE_SELF_DISCARD', { cardIds: selectedDiscardIds }); return }\n    snapshotVisibleCardRects()`
app = mustReplace(app, oldConfirm, newConfirm, 'discard confirmation validation')

if (!app.includes('className="mx-discard-confirm-sheet"')) {
  const sectionTag = `<section className="duel-shell">`
  const sheet = `${sectionTag}\n            {game.pendingSelfDiscard && game.pendingSelfDiscard.player === localViewer && (\n              <div className="mx-discard-confirm-sheet" role="dialog" aria-modal="true" aria-label="Confirm cards to discard">\n                <div className="mx-discard-confirm-head">\n                  <strong>{game.pendingSelfDiscard.reason.startsWith('SPUDUR') ? 'SPUDUR — PILIH KAD UNTUK DIBUANG' : 'PILIH KAD UNTUK DIBUANG'}</strong>\n                  <span>{selectedDiscardIds.length} / {game.pendingSelfDiscard.count}</span>\n                </div>\n                <div className="mx-discard-confirm-cards">\n                  {game.players[localViewer].hand.map((card) => {\n                    const selected = selectedDiscardIds.includes(card.id)\n                    return <button key={card.id} type="button" className={\`mx-discard-card \${selected ? 'is-selected' : ''}\`} aria-pressed={selected} onClick={() => toggleDiscardCard(card.id)}><CardView card={card} /></button>\n                  })}\n                </div>\n                <button type="button" className="mx-confirm-discard" disabled={game.pendingSelfDiscard.mode === 'EXACT' ? selectedDiscardIds.length !== game.pendingSelfDiscard.count : selectedDiscardIds.length === 0} onClick={confirmSelfDiscard}>CONFIRM DISCARD</button>\n              </div>\n            )}`
  app = mustReplace(app, sectionTag, sheet, 'duel discard sheet insertion')
}

const marker = '/* Arena interaction audit pass */'
if (!css.includes(marker)) css += `
${marker}
.mx-discard-confirm-sheet{position:fixed;left:clamp(6px,2vw,18px);right:clamp(6px,2vw,18px);bottom:max(6px,env(safe-area-inset-bottom));z-index:1500;max-height:min(72dvh,560px);padding:clamp(8px,1.5vw,14px);background:rgba(3,5,12,.97);border:2px solid #f2c960;border-radius:12px;box-shadow:0 0 0 1px #000,0 -8px 28px #000;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:8px;overflow:hidden}
.mx-discard-confirm-head{display:flex;justify-content:space-between;align-items:center;gap:10px;color:#fff;font-size:clamp(12px,2.5vw,16px);letter-spacing:.04em}.mx-discard-confirm-head span{color:#f2c960;font-weight:900;font-size:clamp(16px,3vw,22px)}
.mx-discard-confirm-cards{display:flex;gap:clamp(6px,1vw,10px);overflow-x:auto;overflow-y:hidden;padding:6px 2px 10px;touch-action:pan-x;-webkit-overflow-scrolling:touch}.mx-discard-card{flex:0 0 clamp(72px,16vw,118px);padding:0;border:2px solid transparent;border-radius:7px;background:transparent;opacity:.7;transform:translateY(0);transition:transform .12s ease,opacity .12s ease,border-color .12s ease}.mx-discard-card .digital-card{width:100%!important;height:auto!important;aspect-ratio:420/595!important}.mx-discard-card.is-selected{opacity:1;border-color:#ff4057;transform:translateY(-5px);box-shadow:0 0 16px rgba(255,64,87,.65)}
.mx-confirm-discard{min-height:44px;border:1px solid #ffe18a;border-radius:8px;background:linear-gradient(#f2c960,#b67c0b);color:#070707;font-weight:1000;letter-spacing:.08em}.mx-confirm-discard:disabled{filter:grayscale(1);opacity:.45}
`

fs.writeFileSync(appPath, app)
fs.writeFileSync(cssPath, css)
console.log('Applied discard interaction audit without Arena presentation or audio ownership')
