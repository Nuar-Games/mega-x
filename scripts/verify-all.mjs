import { readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const testsOnly = process.argv.includes('--tests-only')
const regressionFiles = readdirSync('tests', { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('_regression.mjs'))
  .map(entry => `tests/${entry.name}`)
  .sort()

if (testsOnly && regressionFiles.length === 0) {
  console.error('NO_REGRESSION_TESTS_FOUND')
  process.exit(1)
}

const steps = testsOnly
  ? regressionFiles.map(file => ['node', [file]])
  : [
      ['npm', ['run', 'build']],
    ]

for (const [command, args] of steps) {
  console.log(`RUN ${command} ${args.join(' ')}`)
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) {
    console.error(`FAILED ${command} ${args.join(' ')}`)
    process.exit(result.status ?? 1)
  }
}

console.log(testsOnly ? `ALL_REGRESSION_TESTS_PASS count=${regressionFiles.length}` : 'FULL_VERIFY_PASS')
