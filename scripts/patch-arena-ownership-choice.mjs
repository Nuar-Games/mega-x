import fs from 'node:fs'

const appPath = 'src/App.tsx'
const fragmentPath = 'src/arena-blueprint.fragment'
const cssPath = 'src/V24.css'
const arenaCssPath = 'src/arena-stage.css'
let app = fs.readFileSync(appPath, 'utf8')
let fragment = fs.readFileSync(fragmentPath, 'utf8')
let css = fs.readFileSync(cssPath, 'utf8')
let arenaCss = fs.readFileSync(arenaCssPath, 'utf8')

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
  css += `\n${mobileDiscardMarker}\n@media(max-width:560px) and (orientation:portrait){\n  .choice-overlay:has(.discard-panel){position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;padding:0 8px max(7px,env(safe-area-inset-bottom))!important;box-sizing:border-box!important;overflow:hidden!important;background:rgba(0,2,7,.46)!important;backdrop-filter:blur(5px)!important;-webkit-backdrop-filter:blur(5px)!important;z-index:2300!important}\n  .choice-overlay .discard-panel{position:relative!important;inset:auto!important;width:min(100%,440px)!important;height:auto!important;min-height:0!important;max-height:38dvh!important;margin:0!important;padding:10px 10px 9px!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;gap:6px!important;overflow:hidden!important;border:1px solid rgba(247,208,91,.92)!important;border-radius:14px!important;background:linear-gradient(180deg,rgba(12,18,30,.995),rgba(4,7,14,.995))!important;box-shadow:inset 0 1px 0 rgba(255,241,182,.18),inset 0 0 0 1px rgba(255,208,76,.08),0 -10px 32px rgba(0,0,0,.54),0 0 22px rgba(238,187,49,.12)!important}\n  .choice-overlay .discard-panel::before{content:'';position:absolute;left:12px;right:12px;top:0;height:2px;background:linear-gradient(90deg,transparent,#ffe783 18%,#fff6c6 50%,#ffe783 82%,transparent);opacity:.95;pointer-events:none}\n  .choice-overlay .discard-panel :is(h1,h2,h3,strong,p){margin:0!important;line-height:1.05!important}\n  .choice-overlay .discard-panel h2{font-size:clamp(17px,5vw,22px)!important;letter-spacing:.025em!important;color:#ffe37b!important;text-shadow:0 2px 5px #000!important}\n  .choice-overlay .discard-panel p,.choice-overlay .discard-panel strong{font-size:clamp(11px,3.2vw,14px)!important;line-height:1.18!important}\n  .choice-overlay .discard-panel p{display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;color:#ece8dc!important}\n  .choice-overlay .discard-panel :is(div,section):has(>button .digital-card),\n  .choice-overlay .discard-panel :is(div,section):has(>.digital-card){display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:5px!important;align-items:end!important;justify-items:stretch!important;width:100%!important;max-height:19dvh!important;overflow-x:hidden!important;overflow-y:hidden!important;padding:3px 1px 5px!important}\n  .choice-overlay .discard-panel button:has(.digital-card){display:block!important;width:100%!important;min-width:0!important;max-width:none!important;height:auto!important;min-height:0!important;max-height:19dvh!important;margin:0!important;padding:0!important;border:1px solid rgba(232,196,83,.38)!important;border-radius:7px!important;overflow:hidden!important;background:#050812!important;opacity:.82!important;transform:translateY(0)!important;transition:transform .12s ease,opacity .12s ease,border-color .12s ease,box-shadow .12s ease!important}\n  .choice-overlay .discard-panel button:has(.digital-card)[aria-pressed="true"],\n  .choice-overlay .discard-panel button:has(.digital-card).selected,\n  .choice-overlay .discard-panel button:has(.digital-card).is-selected{opacity:1!important;transform:translateY(-4px)!important;border-color:#ffe073!important;box-shadow:0 0 0 1px rgba(255,224,115,.3),0 0 14px rgba(255,195,47,.38)!important}\n  .choice-overlay .discard-panel button:has(.digital-card) .digital-card,\n  .choice-overlay .discard-panel .digital-card{display:block!important;width:100%!important;max-width:100%!important;height:auto!important;max-height:19dvh!important;aspect-ratio:420/595!important;object-fit:contain!important}\n  .choice-overlay .discard-panel>button:last-child{flex:0 0 auto!important;width:100%!important;min-height:40px!important;height:40px!important;margin:0!important;font-size:clamp(14px,4.2vw,17px)!important;letter-spacing:.08em!important;border:1px solid #ffe078!important;border-radius:9px!important;background:linear-gradient(180deg,#8e2418,#4d0e09)!important;box-shadow:inset 0 1px 0 rgba(255,215,159,.2)!important}\n}\n`
}

const mobileArenaMarker = '/* Android arena declutter authority */'
if (!arenaCss.includes(mobileArenaMarker)) {
  arenaCss += `\n${mobileArenaMarker}\n@media(max-width:560px) and (orientation:portrait){\n  .duel-shell.mx3-stage .mx3-premium-rail{display:none!important}\n  .duel-shell.mx3-stage .mx3-canvas::after{left:145px!important;right:145px!important;top:414px!important;height:430px!important;border:0!important;box-shadow:none!important;background:radial-gradient(ellipse at 50% 52%,rgba(22,99,170,.10),transparent 66%)!important}\n  .duel-shell.mx3-stage .mx3-local-hand{top:920px!important;height:176px!important}\n  .duel-shell.mx3-stage .mx3-local-hand .mx3-hand-label{top:0!important;height:28px!important;font-size:13px!important}\n  .duel-shell.mx3-stage .mx3-local-hand .mx3-hand-row{top:36px!important;height:140px!important}\n  .duel-shell.mx3-stage .mx3-local-hand.is-live::before{top:31px!important;height:145px!important;border-color:rgba(255,205,55,.10)!important;box-shadow:0 0 15px rgba(255,194,40,.07)!important}\n}\n`
}

fs.writeFileSync(fragmentPath, fragment)
fs.writeFileSync(appPath, app)
fs.writeFileSync(cssPath, css)
fs.writeFileSync(arenaCssPath, arenaCss)
console.log('Applied clean fighter identity, compact Android command tray, and mobile arena declutter')
