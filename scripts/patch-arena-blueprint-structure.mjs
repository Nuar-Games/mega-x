import fs from 'node:fs'

const appPath = 'src/App.tsx'
let app = fs.readFileSync(appPath, 'utf8')

const opening = '<section className="duel-shell">'
if (!app.includes('mx-blueprint-stage')) {
  const start = app.indexOf(opening)
  if (start < 0) throw new Error('blueprint rebuild: duel-shell opening not found')

  const contentStart = start + opening.length
  const tagRe = /<section\b[^>]*>|<\/section>/g
  tagRe.lastIndex = contentStart
  let depth = 1
  let closeStart = -1
  let match
  while ((match = tagRe.exec(app))) {
    if (match[0].startsWith('</section')) depth -= 1
    else depth += 1
    if (depth === 0) {
      closeStart = match.index
      break
    }
  }
  if (closeStart < 0) throw new Error('blueprint rebuild: duel-shell closing section not found')

  const rebuiltOpen = '<section className="duel-shell mx-blueprint-shell">\n            <div className="mx-blueprint-stage">'
  const rebuiltClose = '            </div>\n          </section>'
  app = app.slice(0, start) + rebuiltOpen + app.slice(contentStart, closeStart) + rebuiltClose + app.slice(closeStart + '</section>'.length)
}

fs.writeFileSync(appPath, app)
console.log('Rebuilt duel-shell around one mx-blueprint-stage structural coordinate map')
