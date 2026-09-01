import fs from 'node:fs'

const appPath = 'src/App.tsx'
let app = fs.readFileSync(appPath, 'utf8')
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
    candidates.push({ start, closeStart, insideDuelShell })
    cursor = closeStart + '</div>'.length
  } else cursor = start + opening.length
}

const inShell = candidates.filter((candidate) => candidate.insideDuelShell)
if (inShell.length !== 1) throw new Error(`Arena extract: expected one arena-wrap inside duel-shell, found ${inShell.length}`)
const chosen = inShell[0]
const block = app.slice(chosen.start, chosen.closeStart + '</div>'.length)
console.log('MX_ARENA_BLOCK_START')
console.log(block)
console.log('MX_ARENA_BLOCK_END')
throw new Error('MX_ARENA_EXTRACTION_COMPLETE')
