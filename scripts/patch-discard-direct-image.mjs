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

const marker = '/* Android discard direct-art authority */'
const block = `${marker}\n@media(max-width:560px) and (orientation:portrait){\n  body.mx3-arena-present .choice-overlay:has(.discard-panel),body.mx3-arena-present .choice-overlay .discard-panel,body.mx3-arena-present .choice-overlay .discard-panel .discard-card-grid{pointer-events:auto!important}\n  body.mx3-arena-present .choice-overlay .discard-panel .discard-card-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;align-content:start!important;align-items:start!important;overflow-y:auto!important;overflow-x:hidden!important;padding:3px!important}\n  body.mx3-arena-present .choice-overlay .discard-panel .discard-card-choice{position:relative!important;z-index:1!important;display:block!important;width:100%!important;min-width:0!important;max-width:none!important;height:auto!important;min-height:0!important;max-height:none!important;aspect-ratio:auto!important;padding:0!important;margin:0!important;overflow:hidden!important;background:#050812!important;pointer-events:auto!important;touch-action:manipulation!important;cursor:pointer!important}\n  body.mx3-arena-present .choice-overlay .discard-panel .discard-card-choice>.discard-card-art{position:relative!important;inset:auto!important;z-index:1!important;display:block!important;width:100%!important;height:auto!important;min-width:0!important;min-height:0!important;max-width:100%!important;max-height:none!important;object-fit:contain!important;opacity:1!important;visibility:visible!important;filter:none!important;transform:none!important;clip-path:none!important;mix-blend-mode:normal!important;pointer-events:none!important}\n  body.mx3-arena-present .choice-overlay .discard-panel .discard-card-choice>.discard-check{position:absolute!important;left:4px!important;right:4px!important;bottom:4px!important;z-index:3!important;pointer-events:none!important}\n}\n`
const oldAt = css.indexOf(marker)
if (oldAt >= 0) css = css.slice(0, oldAt)
css += `\n${block}`

runtime = runtime.replaceAll("repeat(3,minmax(0,1fr))", "repeat(2,minmax(0,1fr))")
runtime = runtime
  .replace("    button.style.setProperty('aspect-ratio', '420 / 595', 'important')\n", "    button.style.setProperty('aspect-ratio', 'auto', 'important')\n")
  .replace("    image.style.setProperty('position', 'absolute', 'important')\n", "    image.style.setProperty('position', 'relative', 'important')\n")
  .replace("    image.style.setProperty('inset', '0', 'important')\n", "    image.style.setProperty('inset', 'auto', 'important')\n")
  .replace("    image.style.setProperty('height', '100%', 'important')\n", "    image.style.setProperty('height', 'auto', 'important')\n")
  .replace("    image.style.setProperty('max-width', 'none', 'important')\n", "    image.style.setProperty('max-width', '100%', 'important')\n")
if (!runtime.includes("button.style.setProperty('pointer-events', 'auto', 'important')")) {
  runtime = runtime.replace(
    "button.style.setProperty('position', 'relative', 'important')",
    "button.style.setProperty('position', 'relative', 'important')\n    button.style.setProperty('pointer-events', 'auto', 'important')\n    button.style.setProperty('touch-action', 'manipulation', 'important')\n    button.style.setProperty('z-index', '1', 'important')",
  )
}
if (!runtime.includes("image.style.setProperty('pointer-events', 'none', 'important')")) {
  runtime = runtime.replace(
    "image.style.setProperty('z-index', '2', 'important')",
    "image.style.setProperty('z-index', '2', 'important')\n    image.style.setProperty('pointer-events', 'none', 'important')",
  )
}
if (!runtime.includes("check.style.setProperty('pointer-events', 'none', 'important')")) {
  runtime = runtime.replace(
    "check.style.setProperty('opacity', '1', 'important')",
    "check.style.setProperty('opacity', '1', 'important')\n    check.style.setProperty('pointer-events', 'none', 'important')",
  )
}

if (!app.includes('className="discard-card-art"')) throw new Error('Direct discard artwork not installed')
if (!css.includes('grid-template-columns:repeat(2,minmax(0,1fr))')) throw new Error('Discard grid must be two columns')
if (!css.includes('>.discard-card-art{position:relative!important;inset:auto!important')) throw new Error('Discard artwork must participate in natural button height')
if (!runtime.includes("repeat(2,minmax(0,1fr))")) throw new Error('Runtime discard grid must be two columns')
if (!runtime.includes("button.style.setProperty('pointer-events', 'auto', 'important')")) throw new Error('Discard buttons must receive taps')
if (!runtime.includes("image.style.setProperty('pointer-events', 'none', 'important')")) throw new Error('Discard artwork must not intercept taps')

fs.writeFileSync(appPath, app)
fs.writeFileSync(cssPath, css)
fs.writeFileSync(runtimePath, runtime)
console.log('Discard selector uses natural card height in two columns with button-owned tap handling')
