import fs from 'node:fs'

const appPath = 'src/App.tsx'
const fragmentPath = 'src/arena-blueprint.fragment'
const stagePath = 'src/arena-stage.css'
let app = fs.readFileSync(appPath, 'utf8')
let stage = fs.readFileSync(stagePath, 'utf8')
if (!app.includes("from './arena-card-info.ts'")) app = `import { CARD_INFO } from './arena-card-info.ts'\n${app}`
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
        <strong className="mx3-card-overlay-name">{CARD_INFO[focusedCard.id]?.name ?? focusedCard.name}</strong>
        <div className="mx3-card-overlay-stats">
          <span>ATK <b>{CARD_INFO[focusedCard.id]?.atk ?? (focusedCard as any).atk ?? '—'}</b></span>
          <span>DEF <b>{CARD_INFO[focusedCard.id]?.def ?? (focusedCard as any).def ?? '—'}</b></span>
          <span>STA <b>{CARD_INFO[focusedCard.id]?.sta ?? (focusedCard as any).sta ?? '—'}</b></span>
        </div>
        <p className="mx3-card-overlay-effect">{CARD_INFO[focusedCard.id]?.effect ?? 'TIADA EFFECT.'}</p>
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

function addToRule(selector, declarations) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(${escaped}\\{[^}]*)(\\})`)
  if (!re.test(stage)) throw new Error(`Arena final lock: CSS rule missing ${selector}`)
  stage = stage.replace(re, (_whole, body, close) => `${body}${body.trimEnd().endsWith(';') ? '' : ';'}${declarations}${close}`)
}

addToRule('.mx3-status', 'font-size:11px!important;line-height:1.04!important;padding:4px 12px!important;')
addToRule('.mx3-opponent-hand', 'left:210px!important;width:360px!important;')
addToRule('.mx3-opponent-hand .mx3-hand-row', 'width:360px!important;gap:4px!important;')
addToRule('.mx3-card-back', 'width:68px!important;')
addToRule('.mx3-opponent-hand .mx3-hand-label', 'width:360px!important;overflow:hidden!important;contain:paint!important;')
addToRule('.mx3-phase-prompt', 'left:250px!important;top:470px!important;width:280px!important;height:54px!important;gap:4px!important;padding:4px!important;animation:mx3PromptBob .9s ease-in-out infinite alternate!important;')
addToRule('.mx3-phase-prompt strong', 'font-size:15px!important;')
addToRule('.mx3-phase-prompt button', 'height:24px!important;padding:0 10px!important;font-size:10px!important;')
addToRule('.mx3-center-vs', "left:337px!important;top:538px!important;width:106px!important;height:66px!important;padding:0!important;background:url('/ui/vs.webp') center/contain no-repeat!important;filter:drop-shadow(0 0 10px rgba(255,190,28,.75))!important;")
addToRule('.mx3-center-vs span', 'display:none!important;')
addToRule('.mx3-center-vs i', 'display:none!important;')
if (!stage.includes('@keyframes mx3PromptBob')) stage += `\n@keyframes mx3PromptBob{from{transform:translateY(0) scale(.985);filter:brightness(.96);box-shadow:0 0 8px rgba(211,174,59,.18)}to{transform:translateY(-5px) scale(1.015);filter:brightness(1.18);box-shadow:0 0 24px rgba(211,174,59,.50)}}\n`
if (!stage.includes('.mx3-center-vs::before')) stage += `\n.mx3-center-vs::before{content:'';position:absolute;left:50%;top:50%;width:150px;height:150px;transform:translate(-50%,-50%);pointer-events:none;background:radial-gradient(circle,rgba(255,255,220,.95) 0 2px,rgba(255,207,68,.78) 3px 7px,rgba(255,167,24,.22) 8px 24px,transparent 55%);mix-blend-mode:screen;animation:mx3VsFlarePulse 1.25s ease-in-out infinite alternate}\n.mx3-center-vs::after{content:'';position:absolute;left:50%;top:50%;width:190px;height:3px;transform:translate(-50%,-50%) rotate(-8deg);pointer-events:none;background:linear-gradient(90deg,transparent,rgba(255,179,35,.18),#fff8c7,rgba(255,184,35,.72),transparent);box-shadow:0 0 12px rgba(255,173,24,.92);mix-blend-mode:screen;animation:mx3VsFlareSweep 1.8s ease-in-out infinite}\n@keyframes mx3VsFlarePulse{from{opacity:.46;transform:translate(-50%,-50%) scale(.82)}to{opacity:1;transform:translate(-50%,-50%) scale(1.08)}}\n@keyframes mx3VsFlareSweep{0%,100%{opacity:.35;transform:translate(-50%,-50%) rotate(-8deg) scaleX(.72)}50%{opacity:1;transform:translate(-50%,-50%) rotate(-8deg) scaleX(1.08)}}\n`

if (!app.includes('mx3-canvas')) throw new Error('Arena MX3 rebuild: new fixed canvas missing')
if (!app.includes('mx3-local-hand') || !app.includes('mx3-opponent-hand')) throw new Error('Arena MX3 rebuild: new hands missing')
if (!app.includes('mx3-vs-left') || !app.includes('mx3-effects-left')) throw new Error('Arena MX3 rebuild: battlefield missing')
if (!app.includes('mx3-card-overlay-panel')) throw new Error('Arena MX3 rebuild: compact card overlay missing')
if (!app.includes('CARD_INFO[focusedCard.id]?.effect')) throw new Error('Arena MX3 rebuild: authoritative card info missing')
if (app.includes('mx3-card-overlay-preview')) throw new Error('Arena MX3 rebuild: selected-card image preview survived')
if (!app.includes('mx3-begin-round') || !app.includes('onClick={beginRound}')) throw new Error('Arena MX3 rebuild: round progression control missing')
if (app.includes('<div className="arena-wrap">')) throw new Error('Arena MX3 rebuild: legacy board survived')
if (app.includes('<header className="fighter-hud">')) throw new Error('Arena MX3 rebuild: legacy HUD survived')
if (/className="mx2-|className={`mx2-/.test(app.slice(shellStart))) throw new Error('Arena MX3 rebuild: mx2 presentation survived in duel')
if (!stage.includes("url('/ui/vs.webp')") || !stage.includes('mx3VsFlarePulse')) throw new Error('Arena final lock: supplied VS artwork/lens flare missing')
if (!stage.includes('contain:paint')) throw new Error('Arena final lock: opponent hand containment missing')
fs.writeFileSync(appPath, app)
fs.writeFileSync(stagePath, stage)
console.log(`Rebuilt fixed Arena MX3; final lock applied: supplied VS art + lens flare, compact bobbing prompt, smaller status copy, contained opponent hand; replaced ${focusCount} focused-card path(s)`)
