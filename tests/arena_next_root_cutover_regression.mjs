import assert from 'node:assert/strict'
import fs from 'node:fs'

const root=fs.readFileSync('src/root.tsx','utf8')
const main=fs.readFileSync('src/main.tsx','utf8')
const app=fs.readFileSync('src/App.tsx','utf8')

assert.match(root,/import App from ['"]\.\/App\.tsx['"]/,'root must retain the existing app for non-match screens')
assert.match(root,/ArenaNextRuntime/,'root must own the arena-next production import')
assert.match(root,/getMyActiveMatch/,'root must resolve the real active match')
assert.match(root,/getPracticeMatchForUser/,'root must reuse the existing guest Practice match')
assert.match(root,/\['ACTIVE','PAUSED','COMPLETED'\]/,'root must cut over only after VS/coin-toss presentation')
assert.match(root,/allowPracticeBootstrap=\{false\}/,'root cutover must not create a second Practice match')
assert.match(root,/session=\{arenaRoute\.session\}/,'root must pass the active session into arena-next')
assert.match(root,/match=\{arenaRoute\.match\}/,'root must pass the active match into arena-next')

assert.match(main,/import Root from ['"]\.\/root\.tsx['"]/,'main must import the hand-authored root')
assert.match(main,/<Root \/>/,'main must render the hand-authored root')
assert.equal(main.includes("import App from './App.tsx'"),false,'main must no longer mount App directly')
assert.equal(main.includes('ArenaNextRuntime'),false,'main must not import arena-next directly')
assert.equal(app.includes('ArenaNextRuntime'),false,'generated App must never import arena-next')

console.log('PASS arena-next active-match root cutover')
