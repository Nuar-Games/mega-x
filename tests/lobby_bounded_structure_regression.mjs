import fs from 'node:fs'

const app = fs.readFileSync('src/App.tsx', 'utf8')
const ui = fs.readFileSync('src/lobby-ui.ts', 'utf8')
const css = fs.readFileSync('src/lobby-final.css', 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(!app.includes('className="mx-find-match"'), 'FIND MATCH is still rendered in the Lobby header')
assert(!app.includes('className="mx-inbox-button"'), 'INBOX is still rendered in the Lobby header')
assert(!app.includes('className="mx-mail-compose-button"'), 'MAIL is still rendered in the Lobby header')
assert(app.includes('<h1>TOP X FIGHTERS</h1>'), 'leaderboard title is not TOP X FIGHTERS at render time')
assert(/mx-rank-card[^\n]*<b>#\{place\}<\/b><strong>\{row\?\.fighter_handle[^\n]*<span>\{row \? `\$\{row\.points\} PTS`/.test(app), 'top ranking cards do not render rank, name, and points as three ordered lines')

// The Sep-3 "authoritative" Lobby redesign replaced the earlier fixed-pixel
// boxes with responsive bounding (clamp()/max-height/media queries) and
// renamed .mx-lobby-right to .mx-area-chat. Same guarantees, current names.
assert(/\.mx-online-roster\s*\{[^}]*overflow-y:\s*auto!important/s.test(css), 'Online X Fighters lacks an internal scroll region')
assert(/\.mx-online-roster\s*\{[^}]*max-height:\s*480px!important/s.test(css), 'Online X Fighters is not height-bounded')
assert(/\.mx-area-chat\s*\{[^}]*overflow:\s*hidden!important/s.test(css), 'Global Chat panel lacks a fixed boundary')
assert(/\.mx-global-chat-feed\s*\{[^}]*overflow-y:\s*auto!important/s.test(css), 'Global Chat feed lacks an internal vertical scroller')

assert(ui.includes("toggle.textContent = 'VIEW #4–#20'"), 'collapsible leaderboard control is missing')
assert(ui.includes("board.classList.add('mx-ranks-collapsible-clean')"), 'collapsed leaderboard state is missing')
assert(fs.readFileSync('src/index.css', 'utf8').includes('.mx-leaderboard.mx-ranks-collapsible-clean:not(.mx-ranks-expanded-clean) .mx-rank-stack'), 'leaderboard stack is not collapsed by default')
assert(!ui.includes('removeDeferredLobbyButtons'), 'Lobby actions are still removed by mutation-time text matching')
assert(!ui.includes('renameLeaderboard'), 'leaderboard title is still rewritten after render')
assert(ui.includes('/rest/v1/rpc/get_lobby_metrics') && ui.includes('fights_played'), 'fight counter is not connected to the server-authoritative lobby metrics aggregate')

console.log('PASS Lobby uses bounded panels, collapsible ranking, authoritative markup, three-line top cards, and the real fight count')
