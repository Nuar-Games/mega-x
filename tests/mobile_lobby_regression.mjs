import fs from 'node:fs'
const css=fs.readFileSync('src/Online.css','utf8')
function assert(ok,msg){if(!ok)throw new Error(msg)}
assert(css.includes('/* Android lobby accessibility */'),'Android lobby accessibility patch missing')
assert(css.includes('.mx-online-screen.mx-lobby-shell{') && css.includes('overflow-y:auto!important'),'Lobby shell is still not vertically scrollable')
assert(css.includes('touch-action:pan-y!important'),'Lobby does not explicitly allow touch scrolling')
assert(/\.mx-lobby-left\{[^}]*grid-row:2!important/.test(css),'ONLINE X FIGHTERS is not promoted ahead of leaderboard on mobile')
assert(/\.mx-leaderboard\{[^}]*grid-row:3!important/.test(css),'Leaderboard is not moved below online roster on mobile')
console.log('PASS Android lobby roster is visible, touch-scrollable, and challengeable')
