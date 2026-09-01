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

assert(/\.mx-online-roster\s*\{[^}]*height:\s*300px!important[^}]*overflow-y:\s*auto!important/s.test(css), 'Online X Fighters lacks a fixed-height internal scroll region')
assert(/\.mx-lobby-right\s*\{[^}]*height:\s*430px!important[^}]*overflow:\s*hidden!important/s.test(css), 'Global Chat panel lacks a fixed-height boundary')
assert(/\.mx-global-chat-feed\s*\{[^}]*height:\s*340px!important[^}]*overflow-y:\s*auto!important/s.test(css), 'Global Chat feed lacks an internal vertical scroller')

assert(!ui.includes('VIEW #4–#20'), 'obsolete collapsible leaderboard control is still active')
assert(!ui.includes('mx-ranks-collapsible'), 'obsolete collapsed leaderboard state is still active')
assert(!ui.includes('removeDeferredLobbyButtons'), 'Lobby actions are still removed by mutation-time text matching')
assert(!ui.includes('renameLeaderboard'), 'leaderboard title is still rewritten after render')
assert(ui.includes('/rest/v1/rpc/get_completed_fight_count'), 'fight counter is not connected to the completed-fight aggregate')

console.log('PASS Lobby uses bounded panels, authoritative markup, three-line top cards, and the real fight count')
