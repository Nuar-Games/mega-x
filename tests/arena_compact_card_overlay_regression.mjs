import fs from 'node:fs'

const app = fs.readFileSync('src/App.tsx', 'utf8')
const css = fs.readFileSync('src/arena-overlay.css', 'utf8')
const main = fs.readFileSync('src/main.tsx', 'utf8')
const must = (ok, msg) => { if (!ok) throw new Error(msg) }
const duelStart = app.indexOf('<section className="duel-shell">')
must(duelStart >= 0, 'duel shell missing')
const duel = app.slice(duelStart)

must(main.includes("import './arena-overlay.css'"), 'compact overlay stylesheet not loaded')
must(duel.includes('mx2-card-overlay'), 'compact Arena card overlay missing')
must(duel.includes('mx2-card-overlay-panel'), 'compact Arena card panel missing')
must(duel.includes("setVS(bottomPlayer, focusedCard.id, 'ATK')"), 'compact overlay ATK placement action missing')
must(duel.includes("setVS(bottomPlayer, focusedCard.id, 'DEF')"), 'compact overlay DEF placement action missing')
must(duel.includes('playEffect(bottomPlayer, focusedCard.id)'), 'compact overlay Effect placement action missing')
must(duel.includes('setFocusedCard(null)'), 'compact overlay close action missing')
must(css.includes('.mx2-card-overlay'), 'compact overlay geometry missing')
must(css.includes('max-height:54dvh'), 'compact overlay is not height-limited')
must(css.includes('pointer-events:none'), 'overlay root must not become a full-screen interaction wall')
// pileView intentionally remains a separate pile browser; only the selected-card path must be mx2.
const selectedStart = duel.indexOf('{focusedCard && passToPlayer === null')
must(selectedStart >= 0, 'selected-card render path missing')
const selectedWindow = duel.slice(selectedStart, selectedStart + 700)
must(selectedWindow.includes('mx2-card-overlay'), 'selected card still routes to legacy full-screen inspector')
must(!selectedWindow.includes('card-focus-overlay'), 'selected card still routes to legacy card-focus overlay')

console.log('PASS compact card overlay keeps Arena visible and exposes authoritative VS/Effect actions')
