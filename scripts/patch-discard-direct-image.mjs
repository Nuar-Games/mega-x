import fs from 'node:fs'

const appPath = 'src/App.tsx'
const cssPath = 'src/arena-stage.css'
const runtimePath = 'src/arena-stage.ts'
let app = fs.readFileSync(appPath, 'utf8')
let css = fs.readFileSync(cssPath, 'utf8')
let runtime = fs.readFileSync(runtimePath, 'utf8')

const gridStart = app.indexOf('<div className="discard-card-grid">')
if (gridStart < 0) throw new Error('Discard grid markup missing')
const gridEnd = app.indexOf('</div>', gridStart)
if (gridEnd < 0) throw new Error('Discard grid closing tag missing')
const cardViewNeedle = '<CardView card={card} />'
const cardViewAt = app.indexOf(cardViewNeedle, gridStart)
if (cardViewAt < 0 || cardViewAt > gridEnd) throw new Error('Discard CardView target missing')
const directImage = `<img className="discard-card-art" src={\`/cards/game/\${String(card.id).padStart(2, '0')}.webp\`} alt={card.name} draggable={false} decoding="async" />`
app = app.slice(0, cardViewAt) + directImage + app.slice(cardViewAt + cardViewNeedle.length)

// Keep exactly one authoritative discard instruction/counter, using selectedDiscardIds.length.
// Earlier patches may inject a stale duplicate above this recovered markup; replace only the
// chooser copy between its heading and the card grid, leaving the waiting-opponent branch intact.
const chooserHeadingNeedle = `<h3>{game.pendingSelfDiscard.reason.startsWith('SPUDUR') ? 'PILIH KAD UNTUK SPUDUR' : 'PILIH KAD UNTUK DIBUANG'}</h3>`
const chooserHeadingAt = app.indexOf(chooserHeadingNeedle)
if (chooserHeadingAt < 0) throw new Error('Authoritative discard chooser heading missing')
const chooserCopyStart = chooserHeadingAt + chooserHeadingNeedle.length
const chooserGridAt = app.indexOf('<div className="discard-card-grid">', chooserCopyStart)
if (chooserGridAt < 0) throw new Error('Authoritative discard grid missing after chooser heading')
const authoritativeChooserCopy = `
                    <p>
                      {game.pendingSelfDiscard.mode === 'ANY'
                        ? 'Pilih mana-mana kad tangan yang mahu dibuang, kemudian sahkan. Boleh pilih 0 kad.'
                        : \`Pilih tepat \${game.pendingSelfDiscard.count} kad. \${selectedDiscardIds.length}/\${game.pendingSelfDiscard.count} dipilih.\`}
                    </p>
                    `
app = app.slice(0, chooserCopyStart) + authoritativeChooserCopy + app.slice(chooserGridAt)

const chooserSectionEnd = app.indexOf('<div className="discard-card-grid">', chooserHeadingAt)
const chooserSection = app.slice(chooserHeadingAt, chooserSectionEnd)
if ((chooserSection.match(/Pilih tepat/g) || []).length !== 1) throw new Error('Discard chooser must contain exactly one selected/required counter')
if (!chooserSection.includes('${selectedDiscardIds.length}/${game.pendingSelfDiscard.count} dipilih.')) throw new Error('Discard counter must use selectedDiscardIds.length as its source of truth')

const marker = '/* Android discard direct-art authority */'
const block = `${marker}\n@media(max-width:560px) and (orientation:portrait){\n  body.mx3-arena-present .choice-overlay:has(.discard-panel),body.mx3-arena-present .choice-overlay .discard-panel,body.mx3-arena-present .choice-overlay .discard-panel .discard-card-grid{pointer-events:auto!important}\n  body.mx3-arena-present .choice-overlay .discard-panel .discard-card-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-auto-rows:max-content!important;gap:10px!important;align-content:start!important;align-items:start!important;overflow-y:auto!important;overflow-x:hidden!important;padding:3px!important}\n  body.mx3-arena-present .choice-overlay .discard-panel .discard-card-choice{position:relative!important;z-index:1!important;display:flex!important;flex-direction:column!important;width:100%!important;min-width:0!important;max-width:none!important;height:max-content!important;min-height:0!important;max-height:none!important;aspect-ratio:auto!important;padding:0!important;margin:0!important;overflow:hidden!important;background:#050812!important;pointer-events:auto!important;touch-action:manipulation!important;cursor:pointer!important;transform:none!important}\n  body.mx3-arena-present .choice-overlay .discard-panel .discard-card-choice>.discard-card-art{position:static!important;inset:auto!important;z-index:1!important;display:block!important;width:100%!important;height:auto!important;min-width:0!important;min-height:0!important;max-width:100%!important;max-height:none!important;object-fit:contain!important;opacity:1!important;visibility:visible!important;filter:none!important;transform:none!important;clip-path:none!important;mix-blend-mode:normal!important;pointer-events:none!important}\n  body.mx3-arena-present .choice-overlay .discard-panel .discard-card-choice>.discard-check{position:absolute!important;left:4px!important;right:4px!important;bottom:4px!important;z-index:3!important;pointer-events:none!important}\n}\n`
const oldAt = css.indexOf(marker)
if (oldAt >= 0) css = css.slice(0, oldAt)
css += `\n${block}`

const runtimeStart = runtime.indexOf('function enforceMobileDiscardVisibility() {')
const runtimeEnd = runtime.indexOf('\nfunction syncDesktopPresentation', runtimeStart)
if (runtimeStart < 0 || runtimeEnd < 0) throw new Error('Discard runtime function missing')
const cleanRuntime = `function enforceMobileDiscardVisibility() {\n  if (window.innerWidth > 560) return\n  const panel = document.querySelector<HTMLElement>('.choice-overlay .discard-panel')\n  if (!panel) return\n  const grid = panel.querySelector<HTMLElement>('.discard-card-grid')\n  if (!grid) return\n  grid.style.setProperty('display', 'grid', 'important')\n  grid.style.setProperty('grid-template-columns', 'repeat(2,minmax(0,1fr))', 'important')\n  grid.style.setProperty('grid-auto-rows', 'max-content', 'important')\n  grid.style.setProperty('overflow-y', 'auto', 'important')\n  grid.style.setProperty('overflow-x', 'hidden', 'important')\n  grid.querySelectorAll<HTMLElement>('.discard-card-choice').forEach((button) => {\n    button.style.setProperty('pointer-events', 'auto', 'important')\n    button.style.setProperty('touch-action', 'manipulation', 'important')\n    button.style.setProperty('visibility', 'visible', 'important')\n    button.style.setProperty('opacity', '1', 'important')\n  })\n  grid.querySelectorAll<HTMLImageElement>('.discard-card-choice img').forEach((image) => {\n    image.style.setProperty('pointer-events', 'none', 'important')\n    image.style.setProperty('visibility', 'visible', 'important')\n    image.style.setProperty('opacity', '1', 'important')\n  })\n}\n`
runtime = runtime.slice(0, runtimeStart) + cleanRuntime + runtime.slice(runtimeEnd)

if (!app.includes('className="discard-card-art"')) throw new Error('Direct discard artwork not installed')
if (!css.includes('grid-template-columns:repeat(2,minmax(0,1fr))')) throw new Error('Discard grid must be two columns')
if (!css.includes('grid-auto-rows:max-content!important')) throw new Error('Discard rows must use natural non-overlapping height')
if (!css.includes('>.discard-card-art{position:static!important')) throw new Error('Discard artwork must remain in normal flow')
if (!runtime.includes("grid.style.setProperty('grid-auto-rows', 'max-content', 'important')")) throw new Error('Runtime must preserve non-overlapping rows')
if (runtime.includes("button.style.setProperty('height'")) throw new Error('Runtime must not force discard button height')
if (runtime.includes("image.style.setProperty('position'")) throw new Error('Runtime must not force discard image geometry')

fs.writeFileSync(appPath, app)
fs.writeFileSync(cssPath, css)
fs.writeFileSync(runtimePath, runtime)
console.log('Discard grid locked to two non-overlapping natural-height rows; one authoritative live counter preserved')
