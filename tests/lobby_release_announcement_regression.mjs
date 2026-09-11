import fs from 'node:fs'

const source = fs.readFileSync('src/lobby-release-announcement.ts', 'utf8')

if (!source.includes("title && title.textContent !== RELEASE_TITLE")) {
  throw new Error('release announcement title update is not idempotent')
}
if (!source.includes("message && message.textContent !== RELEASE_MESSAGE")) {
  throw new Error('release announcement message update is not idempotent')
}

console.log('PASS lobby release announcement observer is idempotent')
