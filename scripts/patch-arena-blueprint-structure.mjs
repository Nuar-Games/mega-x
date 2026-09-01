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

const oldOnlineStatus = `{activeOnlineMatch && onlineMessage && <div className="mx-live-status mx-arena-status" role="status">{onlineMessage}</div>}`
app = app.replace(oldOnlineStatus, '')
const oldIntro = `{arenaIntro && <div className="arena-transition-final" aria-hidden="true"><div className="arena-door arena-door-left"></div><div className="arena-door arena-door-right"></div><div className="arena-transition-flash"></div><div className="arena-transition-fight">FIGHT!</div></div>}`
const newIntro = `{arenaIntro && <div className="mx2-entry-flash" aria-hidden="true"><i></i><i></i></div>}`
app = app.replace(oldIntro, newIntro)

if (!app.includes('mx2-arena')) throw new Error('Arena 2 rebuild: new board missing')
if (!app.includes('mx2-local-hand') || !app.includes('mx2-opponent-hand')) throw new Error('Arena 2 rebuild: new hands missing')
if (!app.includes('mx2-vs-frame') || !app.includes('mx2-effect-rail')) throw new Error('Arena 2 rebuild: new battlefield missing')
if (app.includes('<div className="arena-wrap">')) throw new Error('Arena 2 rebuild: rendered legacy board survived')
if (app.includes('<header className="fighter-hud">')) throw new Error('Arena 2 rebuild: rendered legacy HUD survived')

fs.writeFileSync(appPath, app)
console.log('Replaced legacy HUD, hands, field and action bar with total mx2 Arena presentation')
