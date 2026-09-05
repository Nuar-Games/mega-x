import fs from 'node:fs'

const appPath = 'src/App.tsx'
const fragmentPath = 'src/arena-blueprint.fragment'
let app = fs.readFileSync(appPath, 'utf8')
let fragment = fs.readFileSync(fragmentPath, 'utf8')

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`Arena ownership patch target missing: ${label}`)
  return source.replaceAll(from, to)
}

const replacements = [
  ["<span>X FIGHTER 1</span><strong>{playerDisplayName(0)}</strong>", "<span>{bottomPlayer === 0 ? 'ANDA' : 'LAWAN'}</span><strong>{playerDisplayName(0)}</strong>", 'left fighter ownership'],
  ["<span>X FIGHTER 2</span><strong>{playerDisplayName(1)}</strong>", "<span>{bottomPlayer === 1 ? 'ANDA' : 'LAWAN'}</span><strong>{playerDisplayName(1)}</strong>", 'right fighter ownership'],
  ["<span>KAD VS X FIGHTER 1</span>", "<span>{bottomPlayer === 0 ? 'VS ANDA' : 'VS LAWAN'}</span>", 'left VS ownership'],
  ["<span>KAD VS X FIGHTER 2</span>", "<span>{bottomPlayer === 1 ? 'VS ANDA' : 'VS LAWAN'}</span>", 'right VS ownership'],
  ["title: 'X FIGHTER 1 · ZON X'", "title: `${bottomPlayer === 0 ? 'ANDA' : 'LAWAN'} · ZON X`", 'P1 Zon X title'],
  ["title: 'X FIGHTER 1 · ZON TEPI'", "title: `${bottomPlayer === 0 ? 'ANDA' : 'LAWAN'} · ZON TEPI`", 'P1 Zon Tepi title'],
  ["title: 'X FIGHTER 2 · ZON X'", "title: `${bottomPlayer === 1 ? 'ANDA' : 'LAWAN'} · ZON X`", 'P2 Zon X title'],
  ["title: 'X FIGHTER 2 · ZON TEPI'", "title: `${bottomPlayer === 1 ? 'ANDA' : 'LAWAN'} · ZON TEPI`", 'P2 Zon Tepi title'],
]

for (const [from, to, label] of replacements) {
  fragment = replaceRequired(fragment, from, to, label)
  app = replaceRequired(app, from, to, label)
}

const legacyStartToken = "{game.pendingSelfDiscard && game.pendingSelfDiscard.player === localViewer && ("
const authoritativeNextToken = "{game.phase === 'TIE_BREAKER' && game.tieBreaker && ("
const legacyStart = app.indexOf(legacyStartToken)
if (legacyStart < 0) throw new Error('Legacy duplicate discard sheet start missing')
const legacyEnd = app.indexOf(authoritativeNextToken, legacyStart)
if (legacyEnd < 0) throw new Error('Legacy duplicate discard sheet end marker missing')
app = app.slice(0, legacyStart) + app.slice(legacyEnd)

if (app.includes('mx-discard-confirm-sheet') || app.includes('CONFIRM DISCARD')) throw new Error('Legacy duplicate discard sheet survived shared cleanup')
if (!app.includes('choice-overlay') || !app.includes('discard-panel') || !app.includes('SAHKAN BUANG')) throw new Error('Authoritative shared choice overlay was damaged')

fs.writeFileSync(fragmentPath, fragment)
fs.writeFileSync(appPath, app)
console.log('Applied player-relative arena ownership and removed legacy duplicate discard choice surface')
