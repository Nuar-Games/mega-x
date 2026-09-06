import fs from 'node:fs'

const appPath = 'src/App.tsx'
const cssPath = 'src/arena-stage.css'
let app = fs.readFileSync(appPath, 'utf8')
let css = fs.readFileSync(cssPath, 'utf8')

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
const block = `${marker}\n@media(max-width:560px) and (orientation:portrait){\n  body.mx3-arena-present .choice-overlay .discard-panel .discard-card-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;align-content:start!important;align-items:start!important;overflow-y:auto!important;overflow-x:hidden!important;padding:3px!important}\n  body.mx3-arena-present .choice-overlay .discard-panel .discard-card-choice{position:relative!important;display:block!important;width:100%!important;min-width:0!important;max-width:none!important;height:auto!important;min-height:0!important;aspect-ratio:420/595!important;padding:0!important;margin:0!important;overflow:hidden!important;background:#050812!important}\n  body.mx3-arena-present .choice-overlay .discard-panel .discard-card-choice>.discard-card-art{position:absolute!important;inset:0!important;z-index:1!important;display:block!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;object-fit:contain!important;opacity:1!important;visibility:visible!important;filter:none!important;transform:none!important;clip-path:none!important;mix-blend-mode:normal!important}\n  body.mx3-arena-present .choice-overlay .discard-panel .discard-card-choice>.discard-check{z-index:3!important}\n}\n`
const oldAt = css.indexOf(marker)
if (oldAt >= 0) css = css.slice(0, oldAt)
css += `\n${block}`

if (!app.includes('className="discard-card-art"')) throw new Error('Direct discard artwork not installed')
if (!css.includes('>.discard-card-art{position:absolute!important;inset:0!important')) throw new Error('Direct discard artwork CSS missing')

fs.writeFileSync(appPath, app)
fs.writeFileSync(cssPath, css)
console.log('Discard selector now renders direct card artwork outside shared digital-card CSS')
