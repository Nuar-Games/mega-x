import fs from 'node:fs'

const appPath = 'src/App.tsx'
// The three-line stacking rule landed in lobby-last-fixes.css (loaded after
// lobby-final.css, so it has final cascade authority), not lobby-final.css.
const cssPath = 'src/lobby-last-fixes.css'
const app = fs.readFileSync(appPath, 'utf8')
const css = fs.readFileSync(cssPath, 'utf8')

if (!css.includes('/* React already renders Top 3 as b / strong / span. Force that exact markup into three rows. */')) {
  throw new Error('three-line ranking card contract missing')
}
if (!/\.mx-rank-card\{[^}]*flex-direction:column!important/s.test(css)) {
  throw new Error('leaderboard card does not stack rank, username, and points')
}
if (!/<b>#\{place\}<\/b><strong>\{row\?\.fighter_handle[^\n]*<span>\{row \? `\$\{row\.points\} PTS`/.test(app)) {
  throw new Error('leaderboard rank/name/points render order not found')
}

console.log('Leaderboard three-line card regression passed')
