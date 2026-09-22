import fs from 'node:fs'

const source = fs.readFileSync('src/App.tsx', 'utf8')
const failures = []

const expected = `setOnlineSession(session)\n      if (authMode === 'SIGN_UP') {\n        setFighterProfile(null)\n        setOnlineScreen('HANDLE')\n        return\n      }`

if (!source.includes(expected)) failures.push('successful signup session must go directly to HANDLE before profile loading')

const signupIndex = source.indexOf("if (authMode === 'SIGN_UP')")
const loadProfileIndex = source.indexOf('const profile = await loadProfile(session)', signupIndex)
if (signupIndex < 0) failures.push('signup-specific session transition missing')
if (signupIndex >= 0 && loadProfileIndex >= 0 && loadProfileIndex < signupIndex) failures.push('profile load occurs before signup HANDLE transition')

if (failures.length) {
  console.error('SIGNUP SESSION TRANSITION REGRESSION FAIL')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('SIGNUP SESSION TRANSITION REGRESSION PASS')
