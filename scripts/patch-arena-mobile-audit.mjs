import fs from 'node:fs'

const appPath = 'src/App.tsx'
const cssPath = 'src/V24.css'
const audioPath = 'src/audio.ts'
let app = fs.readFileSync(appPath, 'utf8')
let css = fs.readFileSync(cssPath, 'utf8')
let audio = fs.readFileSync(audioPath, 'utf8')

function mustReplace(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`arena audit patch target missing: ${label}`)
  return source.replace(from, to)
}

// Validate discard selection before any authoritative network action. This is especially
// important for SPUDUR, where the player must see and confirm the exact chosen cards.
const oldConfirm = `  function confirmSelfDiscard() {\n    if (activeOnlineMatch) { void dispatchOnlineAction('RESOLVE_SELF_DISCARD', { cardIds: selectedDiscardIds }); return }\n    snapshotVisibleCardRects()\n    const pending = game.pendingSelfDiscard\n    if (!pending || pending.player !== localViewer) return\n    if (pending.mode === 'EXACT' && selectedDiscardIds.length !== pending.count) return`
const newConfirm = `  function confirmSelfDiscard() {\n    const pending = game.pendingSelfDiscard\n    if (!pending || pending.player !== localViewer) return\n    if (pending.mode === 'EXACT' && selectedDiscardIds.length !== pending.count) return\n    if (selectedDiscardIds.length === 0) return\n    if (activeOnlineMatch) { void dispatchOnlineAction('RESOLVE_SELF_DISCARD', { cardIds: selectedDiscardIds }); return }\n    snapshotVisibleCardRects()`
app = mustReplace(app, oldConfirm, newConfirm, 'discard confirmation validation')

// Add one clear, self-contained discard confirmation sheet. It uses the existing selection
// state and authoritative RESOLVE_SELF_DISCARD action; nothing is discarded until CONFIRM.
const duelMarker = `          <section className="duel-shell">\n            {arenaIntro &&`
if (!app.includes('className="mx-discard-confirm-sheet"')) {
  const insert = `          <section className="duel-shell">\n            {game.pendingSelfDiscard && game.pendingSelfDiscard.player === localViewer && (\n              <div className="mx-discard-confirm-sheet" role="dialog" aria-modal="true" aria-label="Confirm cards to discard">\n                <div className="mx-discard-confirm-head">\n                  <strong>{game.pendingSelfDiscard.reason.startsWith('SPUDUR') ? 'SPUDUR — PILIH KAD UNTUK DIBUANG' : 'PILIH KAD UNTUK DIBUANG'}</strong>\n                  <span>{selectedDiscardIds.length} / {game.pendingSelfDiscard.count}</span>\n                </div>\n                <div className="mx-discard-confirm-cards">\n                  {game.players[localViewer].hand.map((card) => {\n                    const selected = selectedDiscardIds.includes(card.id)\n                    return <button key={card.id} type="button" className={\`mx-discard-card \${selected ? 'is-selected' : ''}\`} aria-pressed={selected} onClick={() => toggleDiscardCard(card.id)}><CardView card={card} /></button>\n                  })}\n                </div>\n                <button type="button" className="mx-confirm-discard" disabled={game.pendingSelfDiscard.mode === 'EXACT' ? selectedDiscardIds.length !== game.pendingSelfDiscard.count : selectedDiscardIds.length === 0} onClick={confirmSelfDiscard}>CONFIRM DISCARD</button>\n              </div>\n            )}\n            {arenaIntro &&`
  app = mustReplace(app, duelMarker, insert, 'duel discard sheet insertion')
}

// Card-selection click remains a light tactile UI sound. Gameplay sounds fire only when the
// authoritative visual event appears, so failed/blocked actions do not make false sounds.
audio = audio.replace(
  `    if (label.includes('ATTACK') || label === 'SERANG') { this.playSfx('attack'); return }\n`,
  '',
)

if (!audio.includes('private playArenaEventSfx')) {
  const mutationMarker = `  private onMutations = (mutations: MutationRecord[]) => {`
  const helper = `  private playArenaEventSfx(node: Node) {\n    if (!(node instanceof Element)) return\n    const candidates: Element[] = [node, ...Array.from(node.querySelectorAll('.motion-card-fx, .combat-screen-fx'))]\n    for (const element of candidates) {\n      if (!(element instanceof HTMLElement) || element.dataset.mxSfxFired === '1') continue\n      let kind: MegaXSfx | null = null\n      if (element.matches('.motion-card-fx.draw')) kind = 'draw'\n      else if (element.matches('.motion-card-fx.enter_vs, .motion-card-fx.support')) kind = 'enter'\n      else if (element.matches('.motion-card-fx.destroy')) kind = 'destroy'\n      else if (element.matches('.combat-screen-fx.stage-impact')) kind = 'attack'\n      if (!kind) continue\n      element.dataset.mxSfxFired = '1'\n      this.playSfx(kind)\n    }\n  }\n\n`
  if (!audio.includes(mutationMarker)) throw new Error('arena audit audio mutation marker missing')
  audio = audio.replace(mutationMarker, helper + mutationMarker)
}

audio = audio.replace(
  `      for (const node of nodes) {\n        const text = (node.textContent ?? '').replace(/\\s+/g, ' ').toUpperCase()`,
  `      for (const node of nodes) {\n        this.playArenaEventSfx(node)\n        const text = (node.textContent ?? '').replace(/\\s+/g, ' ').toUpperCase()`,
)
// Destruction now comes from the DESTROY motion event, avoiding duplicate text-triggered blasts.
audio = audio.replace(`        if (text.includes('DIMUSNAHKAN') || text.includes('DESTROY')) this.playSfx('destroy')\n`, '')

const marker = '/* Arena mobile audit pass */'
if (!css.includes(marker)) css += `
${marker}
/* Audio is an accessory, never a battlefield layer. The panel starts hidden in audio.ts;
   while the arena exists the closed button is kept in a safe corner and the opened panel is compact. */
body:has(.duel-shell) #mx-audio-controls{top:58px!important;right:6px!important;z-index:1400!important}
body:has(.duel-shell) #mx-audio-controls [data-audio-toggle]{width:34px!important;height:34px!important;font-size:15px!important;opacity:.9!important}
body:has(.duel-shell) #mx-audio-controls [data-audio-panel]{min-width:148px!important;max-width:168px!important;padding:8px!important;gap:5px!important;font-size:11px!important}
body:has(.duel-shell) #mx-audio-controls [data-audio-panel] input[type=range]{width:92px!important}

.mx-discard-confirm-sheet{position:absolute;left:8px;right:8px;bottom:8px;z-index:1200;padding:10px;background:rgba(3,5,12,.97);border:2px solid #f2c960;border-radius:12px;box-shadow:0 0 0 1px #000,0 -8px 28px #000;display:grid;gap:8px}
.mx-discard-confirm-head{display:flex;justify-content:space-between;align-items:center;gap:10px;color:#fff;font-size:13px;letter-spacing:.04em}.mx-discard-confirm-head span{color:#f2c960;font-weight:900;font-size:16px}
.mx-discard-confirm-cards{display:flex;gap:7px;overflow-x:auto;padding:3px 1px 6px;touch-action:pan-x}.mx-discard-card{flex:0 0 78px;padding:0;border:2px solid transparent;border-radius:7px;background:transparent;opacity:.7;transform:translateY(0);transition:transform .12s ease,opacity .12s ease,border-color .12s ease}.mx-discard-card .digital-card{width:100%!important;height:auto!important}.mx-discard-card.is-selected{opacity:1;border-color:#ff4057;transform:translateY(-5px);box-shadow:0 0 16px rgba(255,64,87,.65)}
.mx-confirm-discard{min-height:44px;border:1px solid #ffe18a;border-radius:8px;background:linear-gradient(#f2c960,#b67c0b);color:#070707;font-weight:1000;letter-spacing:.08em}.mx-confirm-discard:disabled{filter:grayscale(1);opacity:.45}

@media(max-width:560px) and (orientation:portrait){
  /* Give the arena a deliberate three-band structure: HUD, battlefield, hand. */
  .duel-shell .battlefield{top:72px!important;bottom:clamp(204px,29dvh,242px)!important;left:4px!important;right:4px!important}
  .duel-shell .hand-area{height:clamp(198px,28dvh,232px)!important;min-height:clamp(198px,28dvh,232px)!important;max-height:clamp(198px,28dvh,232px)!important;padding-top:2px!important}
  .duel-shell .player-hand .hand-card-wrap{height:clamp(168px,23dvh,200px)!important;margin-left:-18px!important}
  .duel-shell .hand-fan{padding-left:8px!important;padding-right:8px!important}

  /* The fighter HUD is informational; it must not overlap the actual card cells. */
  .duel-shell .opponent-panel{top:74px!important;left:5px!important;max-width:25vw!important;transform:scale(.72)!important}
  .duel-shell .local-panel{bottom:clamp(208px,29.5dvh,246px)!important;left:5px!important;max-width:25vw!important;transform:scale(.72)!important}
  .duel-shell .fighter-field{min-width:0!important;overflow:hidden!important}
  .duel-shell .vs-battle-row{min-width:0!important;gap:2px!important}
  .duel-shell .v9-vs-card .vs-inspect-button,.duel-shell .vs-inspect-button{width:min(21vw,88px)!important;max-height:40%!important}
  .duel-shell .effect-rack{gap:2px!important;padding-inline:2px!important}
  .duel-shell .effect-card-slot{min-width:0!important;max-width:18vw!important}
  .duel-shell .effect-card-slot>span{font-size:6px!important;line-height:1!important}
  .duel-shell .center-clash{transform:scale(.78)!important}

  /* Keep deck/discard labels and cards inside their own lower battlefield band. */
  .duel-shell [data-motion-anchor="master"]{transform:scale(.82)!important;transform-origin:center bottom!important}
  .duel-shell [data-motion-anchor$="-discard"]{transform:scale(.78)!important;transform-origin:center bottom!important}

  .mx-discard-confirm-sheet{bottom:max(6px,env(safe-area-inset-bottom));left:5px;right:5px;padding:8px}.mx-discard-card{flex-basis:72px}
}
`

fs.writeFileSync(appPath, app)
fs.writeFileSync(cssPath, css)
fs.writeFileSync(audioPath, audio)
console.log('Applied arena mobile audit: compact controls, event SFX, layout bands, and explicit discard confirmation')
