import fs from 'node:fs'

const appPath = 'src/App.tsx'
const fragmentPath = 'src/arena-blueprint.fragment'
let app = fs.readFileSync(appPath, 'utf8')
const replacement = fs.readFileSync(fragmentPath, 'utf8').trim()
const opening = '<div className="arena-wrap">'

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

const choices = []
let cursor = 0
while (cursor < app.length) {
  const start = app.indexOf(opening, cursor)
  if (start < 0) break
  const closeStart = findClosingDiv(app, start)
  if (closeStart > start) {
    const block = app.slice(start, closeStart + '</div>'.length)
    const names = ['p1Name','p2Name','p1Effects','p2Effects','onTargetVS','allowDrop','dropOnVS','roundText','statusText','canAttack']
    const bindingCount = names.reduce((sum, name) => sum + (block.includes(name) ? 1 : 0), 0)
    choices.push({ start, closeStart, bindingCount })
    cursor = closeStart + '</div>'.length
  } else {
    cursor = start + opening.length
  }
}

if (!choices.length) throw new Error('Arena rebuild: no balanced legacy arena-wrap found')
const chosen = [...choices].sort((a, b) => b.bindingCount - a.bindingCount)[0]
if (chosen.bindingCount < 4) throw new Error(`Arena rebuild: gameplay arena-wrap not identified; best binding count ${chosen.bindingCount}/10`)

app = app.slice(0, chosen.start) + replacement + app.slice(chosen.closeStart + '</div>'.length)

if (!app.includes('className="mx-arena-board"')) throw new Error('Arena rebuild: authored board missing')
if ((app.match(/mx-position-strip/g) || []).length < 2) throw new Error('Arena rebuild: both VS position rows missing')
if (!app.includes('mx-vs-module') || !app.includes('mx-effect-column')) throw new Error('Arena rebuild: VS/effect structure missing')

fs.writeFileSync(appPath, app)
console.log(`Replaced gameplay arena-wrap with authored board (binding count ${chosen.bindingCount}/10; ${choices.length} candidates checked)`)
