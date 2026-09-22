import fs from 'node:fs'

const auth = fs.readFileSync('src/onlineAuth.ts', 'utf8')
const page = fs.readFileSync('public/signup-complete.html', 'utf8')
const failures = []

if (!auth.includes("location.assign(`/signup-complete.html?email=${emailParam}`)")) failures.push('confirmation-required signup must navigate to standalone confirmation page')
if (!auth.includes('saveSession(session)\n  location.reload()')) failures.push('session signup must save session then reload into existing startup flow')
if (!auth.includes('return new Promise<never>(() => {})')) failures.push('signup must not fall through into the fragile React submit transition after navigation')
if (!page.includes('CHECK YOUR EMAIL')) failures.push('standalone confirmation page missing clear confirmation instruction')
if (!page.includes('RETURN TO MEGA-X')) failures.push('standalone confirmation page missing return path')

if (failures.length) {
  console.error('SIGNUP NAVIGATION REGRESSION FAIL')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('SIGNUP NAVIGATION REGRESSION PASS')
