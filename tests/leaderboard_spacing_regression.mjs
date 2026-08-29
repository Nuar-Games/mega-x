import fs from 'node:fs'

const appPath = 'src/App.tsx'
const cssPath = 'src/Online.css'
const app = fs.readFileSync(appPath, 'utf8')
const css = fs.readFileSync(cssPath, 'utf8')

if (!css.includes('/* Leaderboard identity spacing */')) {
  throw new Error('leaderboard spacing marker missing')
}
if (!css.includes('margin-left:.45rem!important') && !css.includes('column-gap:.45rem!important')) {
  throw new Error('leaderboard username/PTS spacing rule missing')
}
if (!app.includes('PTS')) {
  throw new Error('leaderboard PTS rendering not found')
}

console.log('Leaderboard username/PTS spacing regression passed')
