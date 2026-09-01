import fs from 'node:fs'

const app = fs.readFileSync('src/App.tsx', 'utf8')
const css = fs.readFileSync('src/arena-overlay.css', 'utf8')
const main = fs.readFileSync('src/main.tsx', 'utf8')
const must = (ok, msg) => { if (!ok) throw new Error(msg) }

must(main.includes("import './arena-overlay.css'"), 'compact overlay stylesheet not loaded')
must(app.includes('mx2-card-overlay'), 'compact Arena card overlay missing')
must(app.includes('mx2-card-overlay-panel'), 'compact Arena card panel missing')
must(app.includes("setVS(bottomPlayer, focusedCard.id, 'ATK')"), 'compact overlay ATK placement action missing')
must(app.includes("setVS(bottomPlayer, focusedCard.id, 'DEF')"), 'compact overlay DEF placement action missing')
must(app.includes('playEffect(bottomPlayer, focusedCard.id)'), 'compact overlay Effect placement action missing')
must(app.includes('setFocusedCard(null)'), 'compact overlay close action missing')
must(css.includes('.mx2-card-overlay'), 'compact overlay geometry missing')
must(css.includes('max-height:54dvh'), 'compact overlay is not height-limited')
must(css.includes('pointer-events:none'), 'overlay root must not become a full-screen interaction wall')
must(!app.includes('card-focus-overlay'), 'legacy full-screen card-focus overlay survived')
must(!app.includes('focused-card-stage'), 'legacy full-screen focused-card stage survived')

console.log('PASS compact card overlay keeps Arena visible and exposes authoritative VS/Effect actions')
