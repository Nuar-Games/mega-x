import fs from 'node:fs'

const auth = fs.readFileSync('src/onlineAuth.ts', 'utf8')
const page = fs.readFileSync('public/signup-complete.html', 'utf8')
const failures = []

if (!auth.includes("location.assign(`/signup-complete.html?email=${emailParam}`)")) failures.push('confirmation-required signup must navigate to standalone page')
if (!auth.includes('return new Promise<never>(() => {})')) failures.push('confirmation-required signup must not fall through into app submit flow')
if (!auth.includes('saveSession(session)')) failures.push('immediate-session signup behavior must remain intact')
if (!page.includes('CHECK YOUR EMAIL')) failures.push('confirmation page missing clear instruction')
if (!page.includes('RETURN TO MEGA-X')) failures.push('confirmation page missing return path')

if (failures.length) {
  console.error('SIGNUP CONFIRMATION NAVIGATION REGRESSION FAIL')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('SIGNUP CONFIRMATION NAVIGATION REGRESSION PASS')
