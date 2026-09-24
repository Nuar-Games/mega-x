import assert from 'node:assert/strict'
import fs from 'node:fs'

const build = fs.readFileSync('scripts/build-clean.mjs', 'utf8')
const workflow = fs.readFileSync('.github/workflows/materialize-clean-source.yml', 'utf8')

for (const forbidden of [
  'recovery/',
  '_restore/',
  'patch-',
  'diagnose-',
  'recover-',
  '--prepare-only',
]) {
  assert.equal(
    build.includes(forbidden),
    false,
    `build-clean must not regenerate or patch source: found ${forbidden}`,
  )
}

assert.match(build, /verify-all\.mjs.*--tests-only/s, 'build-clean must run regression tests')
assert.match(build, /verify-gate1\.mjs/, 'build-clean must run Gate 1 verification')
assert.match(build, /['"]tsc['"]/, 'build-clean must run TypeScript compilation')
assert.match(build, /['"]vite['"].*['"]build['"]/s, 'build-clean must run the Vite production build')

assert.equal(workflow.includes('git push'), false, 'CI must never auto-commit or push source')
assert.equal(workflow.includes('--prepare-only'), false, 'CI must never regenerate source')
assert.match(workflow, /npm run build/, 'CI must build and run the regression suite')

for (const removedPath of ['recovery', '_restore']) {
  assert.equal(fs.existsSync(removedPath), false, `${removedPath} must stay deleted`)
}

const obsoleteScripts = fs.readdirSync('scripts').filter((name) =>
  /^(patch-|diagnose-|recover-)/.test(name) || name === 'inspect-auth-app.mjs',
)
assert.deepEqual(obsoleteScripts, [], `obsolete source-rewrite scripts must stay deleted: ${obsoleteScripts.join(', ')}`)

const arenaNextFiles = []
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${entry.name}`
    if (entry.isDirectory()) walk(full)
    else arenaNextFiles.push(full)
  }
}
walk('src/game/arena-next')
assert.ok(arenaNextFiles.length > 0, 'hand-written arena-next source must remain present')

console.log('arena-next pipeline guard regression passed')
