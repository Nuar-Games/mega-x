import fs from 'node:fs'

const cssPath = 'src/Online.css'
let css = fs.readFileSync(cssPath, 'utf8')

const marker = '/* Leaderboard identity spacing */'
if (!css.includes(marker)) {
  css += `\n${marker}\n.mx-rank-card b+span,.mx-rank-card strong+span,.mx-rank-card span+strong{margin-left:.45rem!important}.mx-rank-card{column-gap:.45rem!important}\n`
}

fs.writeFileSync(cssPath, css)
console.log('Applied leaderboard username/PTS spacing')
