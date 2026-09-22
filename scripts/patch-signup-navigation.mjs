import fs from 'node:fs'

const path = 'src/onlineAuth.ts'
let source = fs.readFileSync(path, 'utf8')

const oldBlock = `export async function signUpWithEmail(email: string, password: string) {
  const redirectTo = encodeURIComponent(\`${'${location.origin}'}${'${location.pathname}'}\`)
  const response = await fetch(\`${'${SUPABASE_URL}'}/auth/v1/signup?redirect_to=${'${redirectTo}'}\`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ email, password }),
  })
  const payload = await readJson(response)
  const session = sessionFromAuthPayload(payload)
  if (!session) throw new Error('CHECK YOUR EMAIL TO CONFIRM YOUR ACCOUNT, THEN SIGN IN.')
  saveSession(session)
  return { session, needsEmailConfirmation: false }
}`

const newBlock = `export async function signUpWithEmail(email: string, password: string) {
  const redirectTo = encodeURIComponent(\`${'${location.origin}'}${'${location.pathname}'}\`)
  const response = await fetch(\`${'${SUPABASE_URL}'}/auth/v1/signup?redirect_to=${'${redirectTo}'}\`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ email, password }),
  })
  const payload = await readJson(response)
  const session = sessionFromAuthPayload(payload)
  if (!session) {
    const emailParam = encodeURIComponent(email.trim())
    location.assign(\`/signup-complete.html?email=${'${emailParam}'}\`)
    return new Promise<never>(() => {})
  }
  saveSession(session)
  location.reload()
  return new Promise<never>(() => {})
}`

if (!source.includes(oldBlock)) throw new Error('signup navigation patch target missing')
source = source.replace(oldBlock, newBlock)

if (!source.includes("location.assign(`/signup-complete.html?email=${emailParam}`)")) throw new Error('signup confirmation navigation missing')
if (!source.includes('saveSession(session)\n  location.reload()')) throw new Error('signup session reload missing')

fs.writeFileSync(path, source)
console.log('Patched signup to leave fragile React transition after account creation')
