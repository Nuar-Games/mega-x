import fs from 'node:fs'

const appPath = 'src/App.tsx'
const fragmentPath = 'src/arena-blueprint.fragment'
let app = fs.readFileSync(appPath, 'utf8')
const board = fs.readFileSync(fragmentPath, 'utf8').trim()

const shellOpen = '<section className="duel-shell">'
const shellStart = app.indexOf(shellOpen)
if (shellStart < 0) throw new Error('Arena rebuild: duel-shell opening not found')

function balancedEnd(source, start, tag) {
  const openEnd = source.indexOf('>', start)
  if (openEnd < 0) return -1
  const re = new RegExp(`<${tag}\\b[^>]*>|<\\/${tag}>`, 'g')
  re.lastIndex = openEnd + 1
  let depth = 1
  let match
  while ((match = re.exec(source))) {
    if (match[0].startsWith(`</${tag}`)) depth -= 1
    else depth += 1
    if (depth === 0) return re.lastIndex
  }
  return -1
}

const shellEnd = balancedEnd(app, shellStart, 'section')
if (shellEnd < 0) throw new Error('Arena rebuild: duel-shell closing section not found')
const legacyShell = app.slice(shellStart, shellEnd)

function extractElement(token, required = true, fromIndex = 0) {
  const tokenIndex = legacyShell.indexOf(token, fromIndex)
  if (tokenIndex < 0) {
    if (required) throw new Error(`Arena rebuild: ${token} not found`)
    return null
  }
  const start = legacyShell.lastIndexOf('<', tokenIndex)
  const openEnd = legacyShell.indexOf('>', start)
  const opening = start >= 0 && openEnd >= 0 ? legacyShell.slice(start, openEnd + 1) : ''
  const tagMatch = opening.match(/^<([A-Za-z][A-Za-z0-9:-]*)\b/)
  if (!tagMatch || !opening.includes(token)) {
    if (required) throw new Error(`Arena rebuild: opening element for ${token} not found`)
    return null
  }
  const tag = tagMatch[1]
  const end = balancedEnd(legacyShell, start, tag)
  if (end < 0) throw new Error(`Arena rebuild: closing ${tag} for ${token} not found`)
  return { text: legacyShell.slice(start, end), start, end }
}

function extractHandCalls() {
  const calls = []
  const re = /<([A-Z][A-Za-z0-9]*(?:Hand|hand)[A-Za-z0-9]*)\b/g
  let match
  while ((match = re.exec(legacyShell))) {
    const start = match.index
    const name = match[1]
    const selfClose = legacyShell.indexOf('/>', start)
    const nextOpen = legacyShell.indexOf('<', start + 1)
    if (selfClose >= 0 && (nextOpen < 0 || selfClose < nextOpen)) {
      calls.push({ text: legacyShell.slice(start, selfClose + 2), start, end: selfClose + 2, name })
      re.lastIndex = selfClose + 2
      continue
    }
    const end = balancedEnd(legacyShell, start, name)
    if (end > start) {
      calls.push({ text: legacyShell.slice(start, end), start, end, name })
      re.lastIndex = end
    }
  }
  return calls.filter((item, index, list) => list.findIndex(other => other.start === item.start) === index)
}

const hud = extractElement('fighter-hud')
const handCalls = extractHandCalls()
if (handCalls.length < 2) throw new Error(`Arena rebuild: expected two hand component calls, found ${handCalls.length} (${handCalls.map(item => item.name).join(', ') || 'none'})`)

const discard = extractElement('mx-discard-confirm-sheet', false)
const motion = extractElement('motion-card-fx', false)
const combat = extractElement('combat-screen-fx', false)

const preserved = []
if (discard) preserved.push(`{game.pendingSelfDiscard && game.pendingSelfDiscard.player === localViewer && (${discard.text})}`)
preserved.push(hud.text)
preserved.push(...handCalls.slice(0, 2).map(item => item.text))
if (motion) preserved.push(`{motionFx && (${motion.text})}`)
if (combat) preserved.push(`{combatFx && (${combat.text})}`)
preserved.push(board)

const rebuilt = `<section className="duel-shell">\n${preserved.join('\n')}\n</section>`
app = app.slice(0, shellStart) + rebuilt + app.slice(shellEnd)

if (app.includes('<div className="arena-wrap">') || app.includes('mx-blueprint-stage')) throw new Error('Arena rebuild: legacy arena wrapper survived')
if (!app.includes('className="mx-arena-board"')) throw new Error('Arena rebuild: new board missing')
if ((app.match(/mx-position-strip/g) || []).length < 2) throw new Error('Arena rebuild: both VS position rows missing')

fs.writeFileSync(appPath, app)
console.log(`Rebuilt complete duel-shell with ${handCalls.slice(0, 2).map(item => item.name).join(' + ')} and authored Arena board`)
