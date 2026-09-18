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
  if (source.includes(to)) return source
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

app = app.replaceAll('TANGAN ANDA', 'KAD DI TANGAN')
fragment = fragment.replaceAll('TANGAN ANDA', 'KAD DI TANGAN')

function removeVsLabels(source, label) {
  const before = (source.match(/className="mx3-vs-label"/g) || []).length
  if (before === 0) return source
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
if (legacyStart >= 0) {
  const legacyEnd = app.indexOf(authoritativeNextToken, legacyStart)
  if (legacyEnd < 0) throw new Error('Legacy duplicate discard sheet end marker missing')
  app = app.slice(0, legacyStart) + app.slice(legacyEnd)
}

if (app.includes('mx-discard-confirm-sheet') || app.includes('CONFIRM DISCARD')) throw new Error('Legacy duplicate discard sheet survived shared cleanup')
if (!app.includes('choice-overlay') || !app.includes('discard-panel') || !app.includes('SAHKAN BUANG')) throw new Error('Authoritative shared discard choice overlay was damaged')
if (fragment.includes('mx3-vs-label') || app.includes('mx3-vs-label')) throw new Error('VS card slots must not contain inner text labels')
if (app.includes('TANGAN ANDA') || fragment.includes('TANGAN ANDA')) throw new Error('Obsolete ANDA hand label survived')

// Add one live counter to the authoritative discard panel. Do not duplicate the discard UI.
if (!app.includes('mx-discard-remaining')) {
  const discardPanelOpen = /(<(?:div|section)[^>]*className="discard-panel"[^>]*>)/
  if (!discardPanelOpen.test(app)) throw new Error('Authoritative discard panel opening tag missing')
  app = app.replace(
    discardPanelOpen,
    `$1<div className="mx-discard-remaining">BAKI PILIHAN: {Math.max(0, (game.pendingSelfDiscard?.count ?? 0) - selectedDiscardIds.length)}</div>`,
  )
}

// Remove the older V24 tray authority if it ever exists. Arena-stage owns this UI alone.
css = css.replace(/\n?\/\* Authoritative Android discard tray \*\/[\s\S]*?(?=\n\/\*|$)/g, '')

const mobileArenaMarker = '/* Android arena declutter authority */'
if (!arenaCss.includes(mobileArenaMarker)) {
  arenaCss += `\n${mobileArenaMarker}\n@media(max-width:560px) and (orientation:portrait){\n  .duel-shell.mx3-stage .mx3-premium-rail{display:none!important}\n  .duel-shell.mx3-stage .mx3-canvas::after{left:145px!important;right:145px!important;top:414px!important;height:430px!important;border:0!important;box-shadow:none!important;background:radial-gradient(ellipse at 50% 52%,rgba(22,99,170,.10),transparent 66%)!important}\n  .duel-shell.mx3-stage .mx3-local-hand{top:940px!important;height:170px!important}\n  .duel-shell.mx3-stage .mx3-local-hand .mx3-hand-label{top:0!important;height:28px!important;font-size:13px!important}\n  .duel-shell.mx3-stage .mx3-local-hand .mx3-hand-row{top:42px!important;height:128px!important}\n  .duel-shell.mx3-stage .mx3-local-hand.is-live::before{top:35px!important;height:135px!important;border-color:rgba(255,205,55,.10)!important;box-shadow:0 0 15px rgba(255,194,40,.07)!important}\n}\n`
} else {
  arenaCss = arenaCss
    .replace('top:920px!important;height:176px!important', 'top:940px!important;height:170px!important')
    .replace('top:36px!important;height:140px!important', 'top:42px!important;height:128px!important')
    .replace('top:31px!important;height:145px!important', 'top:35px!important;height:135px!important')
}

const mobileDiscardV2Marker = '/* Android discard tray final authority v2 */'
const mobileDiscardV2 = `${mobileDiscardV2Marker}\n@media(max-width:560px) and (orientation:portrait){\n  body.mx3-arena-present .choice-overlay:has(.discard-panel){position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;padding:0 8px max(8px,env(safe-area-inset-bottom))!important;background:rgba(0,2,7,.5)!important;overflow:hidden!important;box-sizing:border-box!important;z-index:2300!important}\n  body.mx3-arena-present .choice-overlay .discard-panel{position:relative!important;inset:auto!important;width:min(calc(100vw - 16px),430px)!important;height:min(84dvh,720px)!important;min-height:0!important;max-height:84dvh!important;margin:0!important;padding:9px!important;display:flex!important;flex-direction:column!important;gap:7px!important;overflow:hidden!important;box-sizing:border-box!important;border:1px solid rgba(246,207,91,.92)!important;border-radius:13px!important;background:linear-gradient(180deg,rgba(10,16,27,.995),rgba(3,6,12,.995))!important;box-shadow:0 -10px 28px rgba(0,0,0,.5),0 0 18px rgba(236,188,54,.12)!important}\n  body.mx3-arena-present .choice-overlay .discard-panel .mx-discard-remaining{flex:0 0 auto!important;margin:0!important;padding:7px 10px!important;border:1px solid rgba(246,207,91,.45)!important;border-radius:8px!important;background:rgba(246,207,91,.08)!important;color:#ffe17a!important;font-size:15px!important;line-height:1!important;font-weight:900!important;letter-spacing:.05em!important;text-align:center!important}\n  body.mx3-arena-present .choice-overlay .discard-panel :is(h1,h2,h3){margin:0!important;font-size:18px!important;line-height:1.05!important;color:#ffe17a!important;text-align:center!important;flex:0 0 auto!important}\n  body.mx3-arena-present .choice-overlay .discard-panel>strong,body.mx3-arena-present .choice-overlay .discard-panel>p{margin:0!important;font-size:12px!important;line-height:1.15!important;text-align:center!important;flex:0 0 auto!important}\n  body.mx3-arena-present .choice-overlay .discard-panel :is(div,section):has(>button){display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;padding:2px!important;margin:0!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;align-content:start!important;align-items:start!important;flex:1 1 auto!important;box-sizing:border-box!important}\n  body.mx3-arena-present .choice-overlay .discard-panel :is(div,section):has(>button)>button{position:relative!important;display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;aspect-ratio:420/595!important;margin:0!important;padding:0!important;border:1px solid rgba(235,198,83,.4)!important;border-radius:8px!important;overflow:hidden!important;background:#050812!important;transform:none!important;box-sizing:border-box!important}\n  body.mx3-arena-present .choice-overlay .discard-panel :is(div,section):has(>button)>button .digital-card{position:relative!important;inset:auto!important;display:block!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;max-width:100%!important;max-height:100%!important;aspect-ratio:420/595!important;transform:none!important;object-fit:contain!important;overflow:hidden!important}\n  body.mx3-arena-present .choice-overlay .discard-panel :is(div,section):has(>button)>button :is(span,strong,b,em){position:absolute!important;left:4px!important;right:4px!important;bottom:4px!important;z-index:5!important;margin:0!important;padding:3px!important;font-size:10px!important;line-height:1!important;text-align:center!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}\n  body.mx3-arena-present .choice-overlay .discard-panel :is(div,section):has(>button)>button[aria-pressed="true"],body.mx3-arena-present .choice-overlay .discard-panel :is(div,section):has(>button)>button.selected,body.mx3-arena-present .choice-overlay .discard-panel :is(div,section):has(>button)>button.is-selected{transform:translateY(-2px)!important;border-color:#ffe074!important;box-shadow:0 0 0 2px rgba(255,224,116,.24),0 0 14px rgba(255,196,48,.34)!important}\n  body.mx3-arena-present .choice-overlay .discard-panel>button:last-child{width:100%!important;height:42px!important;min-height:42px!important;max-height:42px!important;margin:0!important;padding:0 10px!important;font-size:14px!important;letter-spacing:.06em!important;border:1px solid #ffe078!important;border-radius:8px!important;background:linear-gradient(180deg,#8e2418,#4d0e09)!important;flex:0 0 42px!important}\n}\n`

if (arenaCss.includes(mobileDiscardV2Marker)) {
  arenaCss = arenaCss.replace(new RegExp(`/\\* Android discard tray final authority v2 \\*/[\\s\\S]*?(?=\\n/\\*|$)`), mobileDiscardV2)
} else {
  arenaCss += `\n${mobileDiscardV2}`
}

if (!app.includes('mx-discard-remaining')) throw new Error('Android discard remaining counter missing')
if (!mobileDiscardV2.includes('grid-template-columns:repeat(2,minmax(0,1fr))') || !mobileDiscardV2.includes('overflow-y:auto') || !mobileDiscardV2.includes('aspect-ratio:420/595')) throw new Error('Android discard readable two-column scroll authority missing')

fs.writeFileSync(fragmentPath, fragment)
fs.writeFileSync(appPath, app)
fs.writeFileSync(cssPath, css)
fs.writeFileSync(arenaCssPath, arenaCss)
console.log('Applied PEMAIN terminology, readable two-column Android discard tray, live remaining counter, lower local hand, and mobile arena declutter')
