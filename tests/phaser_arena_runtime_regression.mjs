import fs from 'node:fs'
import assert from 'node:assert/strict'

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const main = fs.readFileSync('src/main.tsx', 'utf8')
const runtime = fs.existsSync('src/phaser-arena.ts') ? fs.readFileSync('src/phaser-arena.ts', 'utf8') : ''
const css = fs.existsSync('src/phaser-arena.css') ? fs.readFileSync('src/phaser-arena.css', 'utf8') : ''

assert.equal(pkg.dependencies?.phaser, '^4.2.1', 'Phaser 4.2.1 must be a runtime dependency')
assert.match(main, /import ['"]\.\/phaser-arena\.ts['"]/, 'main.tsx must boot the Phaser arena adapter')
assert.match(main, /import ['"]\.\/phaser-arena\.css['"]/, 'main.tsx must load Phaser arena layout CSS')
assert.match(runtime, /import \* as Phaser from ['"]phaser['"]/, 'Phaser 4 must use namespace import')
assert.match(runtime, /Phaser\.Scale\.RESIZE/, 'arena renderer must resize with the viewport')
assert.match(runtime, /transparent:\s*true/, 'Phaser canvas must layer beneath the existing HUD during migration')
assert.match(runtime, /MutationObserver/, 'runtime must attach when the duel shell appears')
assert.match(css, /position:\s*fixed/, 'arena host must own the viewport')
assert.match(css, /100dvh/, 'arena host must cover dynamic viewport height')
assert.match(css, /\.mx3-canvas\s*\{[^}]*background:\s*transparent\s*!important/s, 'legacy arena background must become transparent over Phaser')

console.log('Phaser arena runtime contract: OK')
