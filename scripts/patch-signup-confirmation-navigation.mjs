import fs from 'node:fs'

const path = 'src/onlineAuth.ts'
let source = fs.readFileSync(path, 'utf8')

const oldLine = "  if (!session) throw new Error('CHECK YOUR EMAIL TO CONFIRM YOUR ACCOUNT, THEN SIGN IN.')"
const replacement = `  if (!session) {
    const emailParam = encodeURIComponent(email.trim())
    location.assign(\`/signup-complete.html?email=${'${emailParam}'}\`)
    return new Promise<never>(() => {})
  }`

if (!source.includes(oldLine)) throw new Error('signup confirmation error anchor missing')
source = source.replace(oldLine, replacement)

if (!source.includes("location.assign(`/signup-complete.html?email=${emailParam}`)")) throw new Error('standalone signup confirmation navigation missing')
if (!source.includes('return new Promise<never>(() => {})')) throw new Error('signup confirmation must not fall through after navigation')

fs.writeFileSync(path, source)
console.log('Routed confirmation-required signup to standalone confirmation page')
