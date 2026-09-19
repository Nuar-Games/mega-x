import assert from 'node:assert/strict'
import fs from 'node:fs'

const build = fs.readFileSync('scripts/build-clean.mjs', 'utf8')
const workflow = fs.readFileSync('.github/workflows/materialize-clean-source.yml', 'utf8')

for (const staleMigration of [
  'patch-practice-effect-control.mjs',
  'patch-practice-dead-turn.mjs',
]) {
  assert.equal(
    build.includes(`'${staleMigration}'`),
    false,
    `${staleMigration} is a one-time migration and must not remain in build-clean prepare chain`,
  )
}

assert.equal(
  build.includes("'patch-arena-next-runtime-cutover.mjs'"),
  false,
  'arena-next production cutover must not be installed through build-clean patch chain',
)

assert.match(
  workflow,
  /grep[^\n]+arena-next/,
  'CI must reject any patch/build script reference to arena-next regardless of path form',
)

const patchFiles = fs.readdirSync('scripts').filter((name) => /^patch-.*\.mjs$/.test(name))
const offenders = patchFiles.filter((name) => fs.readFileSync(`scripts/${name}`, 'utf8').includes('arena-next'))
assert.deepEqual(offenders, [], `patch scripts must not reference arena-next: ${offenders.join(', ')}`)

console.log('arena-next pipeline guard regression passed')
