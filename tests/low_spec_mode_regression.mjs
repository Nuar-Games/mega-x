import fs from 'node:fs'
import assert from 'node:assert/strict'

const main = fs.readFileSync('src/main.tsx','utf8')
const runtime = fs.readFileSync('src/low-spec.ts','utf8')
const css = fs.readFileSync('src/low-spec.css','utf8')

assert.match(main, /import ['"]\.\/low-spec\.ts['"]/, 'main must load low-spec detection early')
assert.match(main, /import ['"]\.\/low-spec\.css['"]/, 'main must load low-spec overrides')
assert.match(runtime, /deviceMemory/, 'low-spec detection must consider RAM when the browser exposes it')
assert.match(runtime, /hardwareConcurrency/, 'low-spec detection must consider CPU concurrency')
assert.match(runtime, /mx-low-spec/, 'low-spec detection must add the mx-low-spec class')
assert.match(css, /backdrop-filter\s*:\s*none/i, 'low-spec mode must disable backdrop blur')
assert.match(css, /filter\s*:\s*none/i, 'low-spec mode must disable expensive filters')
assert.match(css, /box-shadow\s*:\s*none/i, 'low-spec mode must remove expensive layered shadows')
assert.match(css, /text-shadow\s*:\s*none/i, 'low-spec mode must remove repeated text glow')

console.log('low-spec mode regression contract OK')
