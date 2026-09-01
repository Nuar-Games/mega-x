import fs from 'node:fs'
const css=fs.readFileSync('src/Online.css','utf8')
const finalCss=fs.readFileSync('src/lobby-final.css','utf8')
function assert(ok,msg){if(!ok)throw new Error(msg)}
assert(css.includes('/* Android lobby accessibility */'),'Android lobby accessibility patch missing')
assert(css.includes('.app:has(.mx-lobby-shell)'),'App root is still allowed to clip the mobile lobby')
assert(css.includes('overflow-y:auto!important'),'Document root is not vertically scrollable')
assert(css.includes('touch-action:pan-y!important'),'Lobby does not explicitly allow touch scrolling')
assert(/\.mx-lobby-left\{[^}]*grid-row:2!important/.test(css),'ONLINE X FIGHTERS is not promoted ahead of leaderboard on mobile')
assert(/\.mx-leaderboard\{[^}]*grid-row:3!important/.test(css),'Leaderboard is not moved below online roster on mobile')
assert(/\.mx-rank-stack\{[^}]*max-height:none!important[^}]*overflow:visible!important/.test(css),'Top 20 can still be trapped inside a clipped inner scroller')
assert(/@media\(max-width:560px\)[\s\S]*\.mx-online-roster\{[^}]*height:230px!important[^}]*max-height:230px!important/.test(finalCss),'mobile roster is not bounded')
assert(/@media\(max-width:560px\)[\s\S]*\.mx-global-chat-feed\{[^}]*height:270px!important[^}]*max-height:270px!important/.test(finalCss),'mobile Global Chat is not bounded')
console.log('PASS mobile lobby scrolls at document level while roster and chat stay internally bounded')
