import fs from 'node:fs'

const appPath = 'src/App.tsx'
const fragmentPath = 'src/arena-blueprint.fragment'
let app = fs.readFileSync(appPath, 'utf8')
const replacement = fs.readFileSync(fragmentPath, 'utf8').trim()
const shellStart = app.indexOf('<section className="duel-shell">')
if (shellStart < 0) throw new Error('Arena MX3 rebuild: duel-shell missing')

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
  const templateReturnDepth = []
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i]
    const next = source[i + 1]
    if (mode === 'single' || mode === 'double') { if (ch === '\\') { i += 1; continue }; if ((mode === 'single' && ch === "'") || (mode === 'double' && ch === '"')) mode = 'code'; continue }
    if (mode === 'line-comment') { if (ch === '\n') mode = 'code'; continue }
    if (mode === 'block-comment') { if (ch === '*' && next === '/') { mode = 'code'; i += 1 }; continue }
    if (mode === 'template') { if (ch === '\\') { i += 1; continue }; if (ch === '`') { mode = 'code'; continue }; if (ch === '$' && next === '{') { depth += 1; templateReturnDepth.push(depth - 1); mode = 'code'; i += 1 }; continue }
    if (ch === '/' && next === '/') { mode = 'line-comment'; i += 1; continue }
    if (ch === '/' && next === '*') { mode = 'block-comment'; i += 1; continue }
    if (ch === "'") { mode = 'single'; continue }
    if (ch === '"') { mode = 'double'; continue }
    if (ch === '`') { mode = 'template'; continue }
    if (ch === '{') { depth += 1; continue }
    if (ch === '}') { depth -= 1; if (templateReturnDepth.length && depth === templateReturnDepth[templateReturnDepth.length - 1]) { templateReturnDepth.pop(); mode = 'template' }; if (depth === 0) return i + 1 }
  }
  return -1
}

const headerStart = app.indexOf('<header className="fighter-hud">', shellStart)
if (headerStart < 0) throw new Error('Arena MX3 rebuild: legacy HUD start missing')
const actionStart = app.indexOf('<div className="action-bar">', headerStart)
if (actionStart < 0) throw new Error('Arena MX3 rebuild: legacy action bar missing')
const actionEnd = findClosingDiv(app, actionStart)
if (actionEnd < 0) throw new Error('Arena MX3 rebuild: legacy action bar closing div missing')
const removedRegion = app.slice(headerStart, actionEnd)
for (const required of ['fighter-hud','PlayerHand','arena-wrap','action-bar']) if (!removedRegion.includes(required)) throw new Error(`Arena MX3 rebuild: expected legacy region token missing: ${required}`)
app = app.slice(0, headerStart) + replacement + app.slice(actionEnd)

const focusMarker = '{focusedCard && passToPlayer === null && pendingChoice === null && game.pendingBoardChoice === null'
const compactFocus = `{focusedCard && passToPlayer === null && pendingChoice === null && game.pendingBoardChoice === null && (
  <div className="mx3-card-overlay" role="dialog" aria-modal="false" aria-label="Maklumat kad terpilih">
    <button className="mx3-card-overlay-dismiss" type="button" aria-label="Tutup maklumat kad" onClick={() => setFocusedCard(null)} />
    <div className="mx3-card-overlay-panel">
      <button className="mx3-card-overlay-close" type="button" aria-label="Tutup" onClick={() => setFocusedCard(null)}>×</button>
      <div className="mx3-card-overlay-side">
        <span className="mx3-card-overlay-kicker">KAD TERPILIH</span>
        <strong className="mx3-card-overlay-name">{focusedCard.name}</strong>
        <div className="mx3-card-overlay-stats">
          <span>ATK <b>{(focusedCard as any).atk ?? '—'}</b></span>
          <span>DEF <b>{(focusedCard as any).def ?? '—'}</b></span>
          <span>STA <b>{(focusedCard as any).sta ?? '—'}</b></span>
        </div>
        <p className="mx3-card-overlay-effect">{(focusedCard as any).effect ?? ''}</p>
        <div className="mx3-card-overlay-actions">
          {game.players[bottomPlayer].hand.some((card) => card.id === focusedCard.id) && game.phase === 'SET_VS' && game.needsVS[bottomPlayer] && (activeOnlineMatch ? true : setupPlayer === bottomPlayer) && !pendingChoice && passToPlayer === null && <><button type="button" onClick={() => { setVS(bottomPlayer, focusedCard.id, 'ATK'); setFocusedCard(null) }}>ATK</button><button type="button" onClick={() => { setVS(bottomPlayer, focusedCard.id, 'DEF'); setFocusedCard(null) }}>DEF</button></>}
          {game.players[bottomPlayer].hand.some((card) => card.id === focusedCard.id) && game.phase === 'EFFECT' && game.effectTurn === bottomPlayer && !pendingChoice && passToPlayer === null && <button type="button" onClick={() => { playEffect(bottomPlayer, focusedCard.id); setFocusedCard(null) }}>PLAY EFFECT</button>}
        </div>
      </div>
    </div>
  </div>
)}`
let focusCount = 0
let focusCursor = headerStart + replacement.length
while (true) {
  const start = app.indexOf(focusMarker, focusCursor)
  if (start < 0) break
  const end = findBalancedJsxExpression(app, start)
  if (end < 0) throw new Error('Arena MX3 rebuild: focused-card inspector closing brace missing')
  const next = focusCount === 0 ? compactFocus : ''
  app = app.slice(0, start) + next + app.slice(end)
  focusCount += 1
  focusCursor = start + next.length
}
if (focusCount === 0) throw new Error('Arena MX3 rebuild: focused-card inspector missing')

const oldOnlineStatus = `{activeOnlineMatch && onlineMessage && <div className="mx-live-status mx-arena-status" role="status">{onlineMessage}</div>}`
app = app.replace(oldOnlineStatus, '')
const oldIntro = `{arenaIntro && <div className="arena-transition-final" aria-hidden="true"><div className="arena-door arena-door-left"></div><div className="arena-door arena-door-right"></div><div className="arena-transition-flash"></div><div className="arena-transition-fight">FIGHT!</div></div>}`
app = app.replace(oldIntro, '')

if (!app.includes('mx3-canvas')) throw new Error('Arena MX3 rebuild: new fixed canvas missing')
if (!app.includes('mx3-local-hand') || !app.includes('mx3-opponent-hand')) throw new Error('Arena MX3 rebuild: new hands missing')
if (!app.includes('mx3-vs-left') || !app.includes('mx3-effects-left')) throw new Error('Arena MX3 rebuild: battlefield missing')
if (!app.includes('mx3-card-overlay-panel')) throw new Error('Arena MX3 rebuild: compact card overlay missing')
if (app.includes('mx3-card-overlay-preview')) throw new Error('Arena MX3 rebuild: selected-card image preview survived')
if (!app.includes('mx3-begin-round') || !app.includes('onClick={beginRound}')) throw new Error('Arena MX3 rebuild: round progression control missing')
if (app.includes('<div className="arena-wrap">')) throw new Error('Arena MX3 rebuild: legacy board survived')
if (app.includes('<header className="fighter-hud">')) throw new Error('Arena MX3 rebuild: legacy HUD survived')
if (/className="mx2-|className={`mx2-/.test(app.slice(shellStart))) throw new Error('Arena MX3 rebuild: mx2 presentation survived in duel')
fs.writeFileSync(appPath, app)
console.log(`Rebuilt duel presentation as fixed 780x1110 Arena MX3; restored beginRound; replaced ${focusCount} focused-card path(s) with text-only UI`)
