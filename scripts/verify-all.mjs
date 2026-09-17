import { spawnSync } from 'node:child_process'

const testsOnly = process.argv.includes('--tests-only')
const steps = testsOnly
  ? [
      ['node', ['tests/card_logic_audit_regression.mjs']],
      ['node', ['tests/engine_behavior_regression.mjs']],
      ['node', ['tests/arena_clean_asset_manifest_regression.mjs']],
      ['node', ['tests/arena_3d_input_regression.mjs']],
      ['node', ['tests/arena_performance_fullscreen_regression.mjs']],
    ]
  : [
      ['npm', ['run', 'build']],
    ]

for (const [command, args] of steps) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log(testsOnly ? 'ALL_RULE_TESTS_PASS' : 'FULL_VERIFY_PASS')
