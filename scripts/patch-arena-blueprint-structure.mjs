import fs from 'node:fs'

const appPath = 'src/App.tsx'
const fragmentPath = 'src/arena-blueprint.fragment'
let app = fs.readFileSync(appPath, 'utf8')
const replacement = fs.readFileSync(fragmentPath, 'utf8').trim()

const opening = '<div className="arena-wrap">'
const start = app.indexOf(opening)
if (start < 0) throw new Error('Arena rebuild: legacy arena-wrap opening not found')

const contentStart = start + opening.length
const tagRe = /<div\b[^>]*>|<\/div>/g
tagRe.lastIndex = contentStart
let depth = 1
let closeStart = -1
let match
while ((match = tagRe.exec(app))) {
  if (match[0].startsWith('</div')) {
    depth -= 1
  } else if (!/\/\s*>$/.test(match[0])) {
    depth += 1
  }
  if (depth === 0) {
    closeStart = match.index
    break
  }
}
if (closeStart < 0) throw new Error('Arena rebuild: legacy arena-wrap closing div not found')

// The surrounding IIFE owns the live game bindings and handlers. Replace only its
// returned visual board so gameplay/network state stays authoritative while the old
// Arena presentation is deleted completely.
app = app.slice(0, start) + replacement + app.slice(closeStart + '</div>'.length)

if (app.includes('<div className="arena-wrap">') || app.includes('mx-blueprint-stage')) throw new Error('Arena rebuild: legacy board survived')
if (!app.includes('className="mx-arena-board"')) throw new Error('Arena rebuild: authored board missing')
if ((app.match(/mx-position-strip/g) || []).length < 2) throw new Error('Arena rebuild: both VS position rows missing')
if (!app.includes('mx-vs-module') || !app.includes('mx-effect-column')) throw new Error('Arena rebuild: VS/effect structure missing')

fs.writeFileSync(appPath, app)
console.log('Deleted legacy arena-wrap presentation and returned authored Arena board inside the existing controller scope')
