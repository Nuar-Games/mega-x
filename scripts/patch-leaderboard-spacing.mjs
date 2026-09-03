import fs from 'node:fs'

const cssPath = 'src/Online.css'
let css = fs.readFileSync(cssPath, 'utf8')

const marker = '/* Leaderboard identity spacing */'
if (!css.includes(marker)) {
  css += `\n${marker}\n.mx-rank-card b+span,.mx-rank-card strong+span,.mx-rank-card span+strong{margin-left:.45rem!important}.mx-rank-card{column-gap:.45rem!important}\n`
}

fs.writeFileSync(cssPath, css)
console.log('Applied leaderboard username/PTS spacing')

const app = fs.readFileSync('src/App.tsx', 'utf8')
for (const needle of ["async function submitEmailAuth()", "if (onlineScreen === 'AUTH')", "if (onlineScreen === 'LOBBY')"]) {
  const index = app.indexOf(needle)
  if (index >= 0) {
    console.log(`\n--- FINAL APP ${needle} ---\n${app.slice(index, Math.min(app.length, index + 1800))}\n--- END FINAL APP ---`)
  }
}
