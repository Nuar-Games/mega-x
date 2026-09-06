import fs from 'node:fs'

const appPath = 'src/App.tsx'
const fragmentPath = 'src/arena-blueprint.fragment'
const cssPath = 'src/V24.css'
let app = fs.readFileSync(appPath, 'utf8')
let fragment = fs.readFileSync(fragmentPath, 'utf8')
let css = fs.readFileSync(cssPath, 'utf8')

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`Arena ownership patch target missing: ${label}`)
  return source.replaceAll(from, to)
}

const replacements = [
  ["<span>X FIGHTER 1</span><strong>{playerDisplayName(0)}</strong><em>RANK</em>", "<strong>{playerDisplayName(0)}</strong><em>#{leaderboardRows.find((row) => row.player_id === activeOnlineMatch?.player1_id)?.place ?? '—'}</em>", 'left fighter name/rank'],
  ["<span>X FIGHTER 2</span><strong>{playerDisplayName(1)}</strong><em>RANK</em>", "<strong>{playerDisplayName(1)}</strong><em>#{leaderboardRows.find((row) => row.player_id === activeOnlineMatch?.player2_id)?.place ?? '—'}</em>", 'right fighter name/rank'],
  ["title: 'X FIGHTER 1 · ZON X'", "title: `${bottomPlayer === 0 ? 'PEMAIN' : 'LAWAN'} · ZON X`", 'P1 Zon X title'],
  ["title: 'X FIGHTER 1 · ZON TEPI'", "title: `${bottomPlayer === 0 ? 'PEMAIN' : 'LAWAN'} · ZON TEPI`", 'P1 Zon Tepi title'],
  ["title: 'X FIGHTER 2 · ZON X'", "title: `${bottomPlayer === 1 ? 'PEMAIN' : 'LAWAN'} · ZON X`", 'P2 Zon X title'],
  ["title: 'X FIGHTER 2 · ZON TEPI'", "title: `${bottomPlayer === 1 ? 'PEMAIN' : 'LAWAN'} · ZON TEPI`", 'P2 Zon Tepi title'],
]

for (const [from, to, label] of replacements) {
  fragment = replaceRequired(fragment, from, to, label)
  app = replaceRequired(app, from, to, label)
}

function removeVsLabels(source, label) {
  const before = (source.match(/className="mx3-vs-label"/g) || []).length
  source = source.replace(/\s*<span className="mx3-vs-label"[^>]*>KAD VS X FIGHTER [12]<\/span>/g, '')
  const after = (source.match(/className="mx3-vs-label"/g) || []).length
  if (before < 2 || after !== before - 2) throw new Error(`Arena ownership patch target missing: ${label}`)
  return source
}

fragment = removeVsLabels(fragment, 'fragment inner VS labels')
app = removeVsLabels(app, 'app inner VS labels')

const legacyStartToken = "{game.pendingSelfDiscard && game.pendingSelfDiscard.player === localViewer && ("
const authoritativeNextToken = "{game.phase === 'TIE_BREAKER' && game.tieBreaker && ("
const legacyStart = app.indexOf(legacyStartToken)
if (legacyStart < 0) throw new Error('Legacy duplicate discard sheet start missing')
const legacyEnd = app.indexOf(authoritativeNextToken, legacyStart)
if (legacyEnd < 0) throw new Error('Legacy duplicate discard sheet end marker missing')
app = app.slice(0, legacyStart) + app.slice(legacyEnd)

if (app.includes('mx-discard-confirm-sheet') || app.includes('CONFIRM DISCARD')) throw new Error('Legacy duplicate discard sheet survived shared cleanup')
if (!app.includes('choice-overlay') || !app.includes('discard-panel') || !app.includes('SAHKAN BUANG')) throw new Error('Authoritative shared discard choice overlay was damaged')
if (fragment.includes('mx3-vs-label') || app.includes('mx3-vs-label')) throw new Error('VS card slots must not contain inner text labels')

const mobileDiscardMarker = '/* Authoritative Android discard tray */'
if (!css.includes(mobileDiscardMarker)) {
  css += `\n${mobileDiscardMarker}\n@media(max-width:560px) and (orientation:portrait){\n  .choice-overlay:has(.discard-panel){position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;padding:8px 8px max(8px,env(safe-area-inset-bottom))!important;box-sizing:border-box!important;overflow:hidden!important;background:rgba(0,0,0,.58)!important;z-index:2300!important}\n  .choice-overlay .discard-panel{position:relative!important;inset:auto!important;width:min(100%,430px)!important;height:auto!important;min-height:0!important;max-height:58dvh!important;margin:0!important;padding:12px!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;gap:8px!important;overflow:hidden!important;border:2px solid rgba(245,204,91,.9)!important;border-radius:16px!important;background:linear-gradient(180deg,rgba(8,13,25,.99),rgba(3,6,14,.99))!important;box-shadow:0 18px 55px rgba(0,0,0,.72),0 0 24px rgba(235,190,67,.18)!important}\n  .choice-overlay .discard-panel :is(h1,h2,h3,strong,p){margin:0!important;line-height:1.05!important}\n  .choice-overlay .discard-panel h2{font-size:clamp(20px,5.8vw,28px)!important}\n  .choice-overlay .discard-panel p,.choice-overlay .discard-panel strong{font-size:clamp(14px,4vw,18px)!important}\n  .choice-overlay .discard-panel :is(div,section):has(>button .digital-card),\n  .choice-overlay .discard-panel :is(div,section):has(>.digital-card){display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;align-items:start!important;justify-items:stretch!important;max-height:34dvh!important;overflow-y:auto!important;overflow-x:hidden!important;padding:2px!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}\n  .choice-overlay .discard-panel button:has(.digital-card){display:block!important;width:100%!important;min-width:0!important;max-width:none!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:0!important;border-radius:9px!important;overflow:hidden!important;transform:none!important}\n  .choice-overlay .discard-panel button:has(.digital-card) .digital-card,\n  .choice-overlay .discard-panel .digital-card{display:block!important;width:100%!important;max-width:100%!important;height:auto!important;max-height:none!important;aspect-ratio:420/595!important;object-fit:contain!important}\n  .choice-overlay .discard-panel>button:last-child{flex:0 0 auto!important;width:100%!important;min-height:46px!important;height:46px!important;margin:2px 0 0!important;font-size:18px!important;letter-spacing:.06em!important;border-radius:9px!important}\n}\n`
}

fs.writeFileSync(fragmentPath, fragment)
fs.writeFileSync(appPath, app)
fs.writeFileSync(cssPath, css)
console.log('Applied clean fighter identity and authoritative compact Android discard tray')
