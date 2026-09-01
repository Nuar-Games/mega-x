import fs from 'node:fs'

const appPath = 'src/App.tsx'
const fragmentPath = 'src/arena-blueprint.fragment'
let app = fs.readFileSync(appPath, 'utf8')
const replacement = fs.readFileSync(fragmentPath, 'utf8').trim()
const opening = '<div className="arena-wrap">'
const shellOpening = '<section className="duel-shell">'

function findClosingDiv(source, start) {
  const contentStart = start + opening.length
  const tagRe = /<div\b[^>]*>|<\/div>/g
  tagRe.lastIndex = contentStart
  let depth = 1
  let match
  while ((match = tagRe.exec(source))) {
    if (match[0].startsWith('</div')) depth -= 1
    else if (!/\/\s*>$/.test(match[0])) depth += 1
    if (depth === 0) return match.index
  }
  return -1
}

const candidates = []
let cursor = 0
while (cursor < app.length) {
  const start = app.indexOf(opening, cursor)
  if (start < 0) break
  const closeStart = findClosingDiv(app, start)
  if (closeStart > start) {
    const shellStart = app.lastIndexOf(shellOpening, start)
    const lastShellClose = app.lastIndexOf('</section>', start)
    const insideDuelShell = shellStart >= 0 && shellStart > lastShellClose
    candidates.push({ start, closeStart, shellStart, insideDuelShell })
    cursor = closeStart + '</div>'.length
  } else {
    cursor = start + opening.length
  }
}

const inShell = candidates.filter((candidate) => candidate.insideDuelShell)
if (inShell.length !== 1) {
  throw new Error(`Arena rebuild: expected exactly one arena-wrap inside duel-shell, found ${inShell.length} (${candidates.length} total candidates)`)
}
const chosen = inShell[0]

app = app.slice(0, chosen.start) + replacement + app.slice(chosen.closeStart + '</div>'.length)

if (!app.includes('className="mx-arena-board"')) throw new Error('Arena rebuild: authored board missing')
if ((app.match(/mx-position-strip/g) || []).length < 2) throw new Error('Arena rebuild: both VS position rows missing')
if (!app.includes('mx-vs-module') || !app.includes('mx-effect-column')) throw new Error('Arena rebuild: VS/effect structure missing')
if (app.includes('<div className="arena-wrap">')) throw new Error('Arena rebuild: legacy arena-wrap survived')

fs.writeFileSync(appPath, app)
console.log(`Replaced the unique legacy arena-wrap inside duel-shell with authored board (${candidates.length} total candidates checked)`)
