import fs from 'node:fs'

const appPath = 'src/App.tsx'
const app = fs.readFileSync(appPath, 'utf8')
const opening = '<section className="duel-shell">'
const start = app.indexOf(opening)
if (start < 0) throw new Error('arena dump: duel-shell opening not found')
const contentStart = start + opening.length
const tagRe = /<section\b[^>]*>|<\/section>/g
tagRe.lastIndex = contentStart
let depth = 1
let closeStart = -1
let match
while ((match = tagRe.exec(app))) {
  if (match[0].startsWith('</section')) depth -= 1
  else depth += 1
  if (depth === 0) { closeStart = match.index; break }
}
if (closeStart < 0) throw new Error('arena dump: duel-shell closing section not found')
const block = app.slice(start, closeStart + '</section>'.length)
console.log('=== MX_ARENA_SOURCE_BEGIN ===')
console.log(block)
console.log('=== MX_ARENA_SOURCE_END ===')
