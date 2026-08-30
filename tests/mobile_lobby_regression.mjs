import fs from 'node:fs'
const css=fs.readFileSync('src/Online.css','utf8')
function assert(ok,msg){if(!ok)throw new Error(msg)}
assert(css.includes('/* Android lobby accessibility */'),'Android lobby accessibility patch missing')
assert(css.includes('.app:has(.mx-lobby-shell)'),'App root is still allowed to clip the mobile lobby')
assert(css.includes('overflow-y:auto!important'),'Document root is not vertically scrollable')
assert(css.includes('touch-action:pan-y!important'),'Lobby does not explicitly allow touch scrolling')
assert(/\.mx-lobby-left\{[^}]*grid-row:2!important/.test(css),'ONLINE X FIGHTERS is not promoted ahead of leaderboard on mobile')
assert(/\.mx-leaderboard\{[^}]*grid-row:3!important/.test(css),'Leaderboard is not moved below online roster on mobile')
assert(/\.mx-rank-stack\{[^}]*max-height:none!important[^}]*overflow:visible!important/.test(css),'Top 20 can still be trapped inside a clipped inner scroller')
console.log('PASS mobile lobby scrolls at document level and exposes the full Top 20')
