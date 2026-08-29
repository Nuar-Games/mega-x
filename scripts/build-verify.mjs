import { spawnSync } from 'node:child_process'

const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: process.platform === 'win32' })
if (result.status !== 0) process.exit(result.status ?? 1)
console.log('BUILD_VERIFY_PASS')
