import fs from 'node:fs'
const app = fs.readFileSync('src/App.tsx','utf8')
const needles = ['function CardView','const CardView','className="digital-card"']
for (const needle of needles) {
  const at = app.indexOf(needle)
  if (at >= 0) throw new Error('CARDVIEW_MARKUP\n' + app.slice(Math.max(0, at - 800), Math.min(app.length, at + 2600)))
}
throw new Error('CardView definition not found')
