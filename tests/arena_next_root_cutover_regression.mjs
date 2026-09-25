import assert from 'node:assert/strict'
import fs from 'node:fs'

const root=fs.readFileSync('src/root.tsx','utf8')
const main=fs.readFileSync('src/main.tsx','utf8')
const app=fs.readFileSync('src/App.tsx','utf8')
const runtime=fs.readFileSync('src/game/arena-next/ArenaNextRuntime.tsx','utf8')

assert.match(root,/import App from ['"]\.\/App\.tsx['"]/,'root must retain the existing app for non-match screens')
assert.equal(/import\s+\{?\s*ArenaNextRuntime/.test(root),false,'root must not eagerly import arena-next or Phaser on pre-match screens')
assert.match(root,/import\(['"]\.\/game\/arena-next\/ArenaNextRuntime['"]\)/,'root must lazy-load the arena-next production runtime')
assert.match(root,/getMyActiveMatch/,'root must resolve the real active match')
assert.match(root,/getPracticeMatchForUser/,'root must reuse the existing guest Practice match')
assert.match(root,/\['ACTIVE','PAUSED','COMPLETED'\]/,'root must cut over only after VS/coin-toss presentation')
assert.match(root,/allowPracticeBootstrap=\{false\}/,'root cutover must not create a second Practice match')
assert.match(root,/session=\{arenaRoute\.session\}/,'root must pass the active session into arena-next')
assert.match(root,/match=\{arenaRoute\.match\}/,'root must pass the active match into arena-next')
assert.match(root,/<Suspense/,'root must provide a loading boundary while the arena chunk is fetched')
assert.equal(/catch\s*\{[\s\S]{0,180}setArenaRoute\(null\)/.test(root),false,'a transient active-match fetch failure must preserve the mounted arena route; only a successful null response may clear it')

assert.match(main,/import Root from ['"]\.\/root\.tsx['"]/,'main must import the hand-authored root')
assert.match(main,/<Root \/>/,'main must render the hand-authored root')
assert.equal(main.includes("import App from './App.tsx'"),false,'main must no longer mount App directly')
assert.equal(main.includes('ArenaNextRuntime'),false,'main must not import arena-next directly')
assert.equal(app.includes('ArenaNextRuntime'),false,'generated App must never import arena-next')

assert.match(runtime,/onUpdate:\(\{state:next,events\}\)=>\{[\s\S]*?setError\(''\)/,'a fresh authoritative arena update must clear a recoverable runtime error')
const transitionStart=runtime.indexOf('transitionRef.current=transitionRef.current.then')
const settledState=runtime.indexOf('setState(next)',transitionStart)
assert.ok(transitionStart>=0&&settledState>transitionStart,'runtime must publish arena status only after the Phaser transition settles')
assert.match(runtime,/data-local-vs-position=\{localVsPosition\}/,'runtime must expose local VS position to real-browser interaction tests')

console.log('PASS arena-next active-match root cutover is lazy-loaded, survives transient network loss, and publishes commands only after rendered state settles')
