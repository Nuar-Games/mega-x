import fs from 'node:fs'

const appPath = 'src/App.tsx'
const fragmentPath = 'src/arena-blueprint.fragment'
let app = fs.readFileSync(appPath, 'utf8')
const board = fs.readFileSync(fragmentPath, 'utf8').trim()

function replaceDivBlock(source, opening, replacement) {
  const start = source.indexOf(opening)
  if (start < 0) throw new Error(`arena rebuild: opening not found: ${opening}`)
  const tagRe = /<div\b[^>]*>|<\/div>/g
  tagRe.lastIndex = start + opening.length
  let depth = 1
  let closeEnd = -1
  let match
  while ((match = tagRe.exec(source))) {
    if (match[0].startsWith('</div')) depth -= 1
    else if (!match[0].endsWith('/>')) depth += 1
    if (depth === 0) { closeEnd = tagRe.lastIndex; break }
  }
  if (closeEnd < 0) throw new Error('arena rebuild: closing div not found')
  return source.slice(0, start) + board + source.slice(closeEnd)
}

app = replaceDivBlock(app, '<div className="arena-wrap">', board)
if (app.includes('mx-blueprint-stage')) throw new Error('arena rebuild: legacy wrapper survived')
if (app.includes('<div className="arena-wrap">')) throw new Error('arena rebuild: legacy arena-wrap survived')
if ((app.match(/mx-position-strip/g) || []).length < 2) throw new Error('arena rebuild: both position strips required')
if ((app.match(/mx-effect-column/g) || []).length < 2) throw new Error('arena rebuild: two effect columns required')

fs.writeFileSync(appPath, app)
console.log('Rebuilt Arena JSX from authored portrait board source')
