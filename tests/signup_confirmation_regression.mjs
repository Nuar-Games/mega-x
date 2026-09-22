import fs from 'node:fs'

const app = fs.readFileSync('src/App.tsx', 'utf8')

const required = [
  "'AUTH_CONFIRM'",
  "setOnlineScreen('AUTH_CONFIRM')",
  "onlineScreen === 'AUTH_CONFIRM'",
  'ACCOUNT CREATED',
  'CHECK YOUR EMAIL',
  "setAuthMode('SIGN_IN')",
]

for (const marker of required) {
  if (!app.includes(marker)) throw new Error(`signup confirmation regression: missing ${marker}`)
}

const noSessionBranch = /if \(!session\) \{[\s\S]{0,240}setOnlineScreen\('AUTH_CONFIRM'\)[\s\S]{0,120}return[\s\S]{0,40}\}/
if (!noSessionBranch.test(app)) throw new Error('signup confirmation regression: no-session signup does not transition to AUTH_CONFIRM')

console.log('signup confirmation regression passed')
