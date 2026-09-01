import fs from 'node:fs'

const appPath = 'src/App.tsx'
const fragmentPath = 'src/arena-blueprint.fragment'
let app = fs.readFileSync(appPath, 'utf8')
const replacement = fs.readFileSync(fragmentPath, 'utf8').trim()
const shellStart = app.indexOf('<section className="duel-shell">')
if (shellStart < 0) throw new Error('Arena 2 rebuild: duel-shell missing')

function findClosingDiv(source, start) {
  const openingEnd = source.indexOf('>', start)
  if (openingEnd < 0) return -1
  const tagRe = /<div\b[^>]*>|<\/div>/g
  tagRe.lastIndex = openingEnd + 1
  let depth = 1
  let match
  while ((match = tagRe.exec(source))) {
    if (match[0].startsWith('</div')) depth -= 1
    else if (!/\/\s*>$/.test(match[0])) depth += 1
    if (depth === 0) return match.index + match[0].length
  }
  return -1
}

function findBalancedJsxExpression(source, start) {
  let depth = 0
  let mode = 'code'
  let returnMode = 'code'
  const templateReturnDepth = []
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i]
    const next = source[i + 1]

    if (mode === 'single' || mode === 'double') {
      if (ch === '\\') { i += 1; continue }
      if ((mode === 'single' && ch === "'") || (mode === 'double' && ch === '"')) mode = returnMode
      continue
    }
    if (mode === 'line-comment') {
      if (ch === '\n') mode = 'code'
      continue
    }
    if (mode === 'block-comment') {
      if (ch === '*' && next === '/') { mode = 'code'; i += 1 }
      continue
    }
    if (mode === 'template') {
      if (ch === '\\') { i += 1; continue }
      if (ch === '`') { mode = 'code'; continue }
      if (ch === '$' && next === '{') {
        depth += 1
        templateReturnDepth.push(depth - 1)
        mode = 'code'
        i += 1
      }
      continue
    }

    if (ch === '/' && next === '/') { mode = 'line-comment'; i += 1; continue }
    if (ch === '/' && next === '*') { mode = 'block-comment'; i += 1; continue }
    if (ch === "'") { returnMode = 'code'; mode = 'single'; continue }
    if (ch === '"') { returnMode = 'code'; mode = 'double'; continue }
    if (ch === '`') { mode = 'template'; continue }
    if (ch === '{') { depth += 1; continue }
    if (ch === '}') {
      depth -= 1
      if (templateReturnDepth.length && depth === templateReturnDepth[templateReturnDepth.length - 1]) {
        templateReturnDepth.pop()
        mode = 'template'
      }
      if (depth === 0) return i + 1
    }
  }
  return -1
}

const headerStart = app.indexOf('<header className="fighter-hud">', shellStart)
if (headerStart < 0) throw new Error('Arena 2 rebuild: legacy HUD start missing')
const actionStart = app.indexOf('<div className="action-bar">', headerStart)
if (actionStart < 0) throw new Error('Arena 2 rebuild: legacy action bar missing')
const actionEnd = findClosingDiv(app, actionStart)
if (actionEnd < 0) throw new Error('Arena 2 rebuild: legacy action bar closing div missing')

const removedRegion = app.slice(headerStart, actionEnd)
for (const required of ['fighter-hud','PlayerHand','arena-wrap','action-bar']) {
  if (!removedRegion.includes(required)) throw new Error(`Arena 2 rebuild: expected legacy region token missing: ${required}`)
}

app = app.slice(0, headerStart) + replacement + app.slice(actionEnd)

// Card play now happens only through the compact selected-card overlay.
app = app.replace(/\{canSet && <div className="mx2-hand-actions"><button className="mx2-set-atk"[\s\S]*?<\/div>\}/, '')
app = app.replace(/\{canEffect && <div className="mx2-hand-actions"><button className="mx2-play-effect"[\s\S]*?<\/div>\}/, '')

const focusMarker = '{focusedCard && passToPlayer === null && pendingChoice === null && game.pendingBoardChoice === null'
const compactFocus = `{focusedCard && passToPlayer === null && pendingChoice === null && game.pendingBoardChoice === null && (
              <div className="mx2-card-overlay" role="dialog" aria-modal="false" aria-label="Maklumat kad terpilih">
                <button className="mx2-card-overlay-dismiss" type="button" aria-label="Tutup maklumat kad" onClick={() => setFocusedCard(null)} />
                <div className="mx2-card-overlay-panel">
                  <button className="mx2-card-overlay-close" type="button" aria-label="Tutup" onClick={() => setFocusedCard(null)}>×</button>
                  <div className="mx2-card-overlay-preview"><CardView card={focusedCard} /></div>
                  <div className="mx2-card-overlay-side">
                    <span className="mx2-card-overlay-kicker">KAD TERPILIH</span>
                    <strong className="mx2-card-overlay-name">{focusedCard.name}</strong>
                    <div className="mx2-card-overlay-actions">
                      {game.players[bottomPlayer].hand.some((card) => card.id === focusedCard.id) && game.phase === 'SET_VS' && game.needsVS[bottomPlayer] && (activeOnlineMatch ? true : setupPlayer === bottomPlayer) && !pendingChoice && passToPlayer === null && <>
                        <button className="mx2-overlay-atk" type="button" onClick={() => { setVS(bottomPlayer, focusedCard.id, 'ATK'); setFocusedCard(null) }}>ATK</button>
                        <button className="mx2-overlay-def" type="button" onClick={() => { setVS(bottomPlayer, focusedCard.id, 'DEF'); setFocusedCard(null) }}>DEF</button>
                      </>}
                      {game.players[bottomPlayer].hand.some((card) => card.id === focusedCard.id) && game.phase === 'EFFECT' && game.effectTurn === bottomPlayer && !pendingChoice && passToPlayer === null && <button className="mx2-overlay-effect" type="button" onClick={() => { playEffect(bottomPlayer, focusedCard.id); setFocusedCard(null) }}>PLAY EFFECT</button>}
                    </div>
                  </div>
                </div>
              </div>
            )}`

let focusCount = 0
let focusCursor = headerStart + replacement.length
while (true) {
  const focusStart = app.indexOf(focusMarker, focusCursor)
  if (focusStart < 0) break
  const focusEnd = findBalancedJsxExpression(app, focusStart)
  if (focusEnd < 0) throw new Error('Arena 2 rebuild: legacy focused-card inspector closing brace missing')
  const next = focusCount === 0 ? compactFocus : ''
  app = app.slice(0, focusStart) + next + app.slice(focusEnd)
  focusCount += 1
  focusCursor = focusStart + next.length
}
if (focusCount === 0) throw new Error('Arena 2 rebuild: legacy focused-card inspector missing')

const oldOnlineStatus = `{activeOnlineMatch && onlineMessage && <div className="mx-live-status mx-arena-status" role="status">{onlineMessage}</div>}`
app = app.replace(oldOnlineStatus, '')
const oldIntro = `{arenaIntro && <div className="arena-transition-final" aria-hidden="true"><div className="arena-door arena-door-left"></div><div className="arena-door arena-door-right"></div><div className="arena-transition-flash"></div><div className="arena-transition-fight">FIGHT!</div></div>}`
const newIntro = `{arenaIntro && <div className="mx2-entry-flash" aria-hidden="true"><i></i><i></i></div>}`
app = app.replace(oldIntro, newIntro)

const duelAfter = app.slice(app.indexOf('<section className="duel-shell">'))
if (!app.includes('mx2-arena')) throw new Error('Arena 2 rebuild: new board missing')
if (!app.includes('mx2-local-hand') || !app.includes('mx2-opponent-hand')) throw new Error('Arena 2 rebuild: new hands missing')
if (!app.includes('mx2-vs-frame') || !app.includes('mx2-effect-rail')) throw new Error('Arena 2 rebuild: new battlefield missing')
if (!app.includes('mx2-card-overlay-panel')) throw new Error('Arena 2 rebuild: compact card overlay missing')
if (duelAfter.includes('card-focus-overlay')) {
  const index = duelAfter.indexOf('card-focus-overlay')
  throw new Error(`Arena 2 rebuild: legacy card-focus overlay survived near: ${duelAfter.slice(Math.max(0,index-180), index+260).replace(/\s+/g,' ')}`)
}
if (app.includes('<div className="arena-wrap">')) throw new Error('Arena 2 rebuild: rendered legacy board survived')
if (app.includes('<header className="fighter-hud">')) throw new Error('Arena 2 rebuild: rendered legacy HUD survived')

fs.writeFileSync(appPath, app)
console.log(`Replaced legacy HUD, hands, field, action bar and ${focusCount} focused-card render path(s) with mx2 Arena presentation`)
