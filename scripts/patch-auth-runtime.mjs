import fs from 'node:fs'

const path = 'src/onlineAuth.ts'
let source = fs.readFileSync(path, 'utf8')
const active = 'sb_publishable_fXF7LXgKXeH4p5_Bwai0nQ_d-NWdOk_'

source = source.replace(
  /const SUPABASE_KEY = VITE_ENV\.VITE_SUPABASE_KEY \|\| '[^']+'/,
  `const SUPABASE_KEY = '${active}'`,
)

const oldBlock = `export async function signInWithEmail(email: string, password: string) {\n  const response = await fetch(\`${'${SUPABASE_URL}'}/auth/v1/token?grant_type=password\`, {\n    method: 'POST', headers: headers(), body: JSON.stringify({ email, password }),\n  })\n  const payload = await readJson(response)\n  const session = sessionFromAuthPayload(payload)\n  if (!session) throw new Error('SESSION_NOT_RETURNED')\n  saveSession(session)\n  return session\n}`

const newBlock = `export async function signInWithEmail(email: string, password: string) {\n  const controller = new AbortController()\n  const timeout = window.setTimeout(() => controller.abort(), 12000)\n  try {\n    const response = await fetch(\`${'${SUPABASE_URL}'}/auth/v1/token?grant_type=password\`, {\n      method: 'POST', headers: headers(), body: JSON.stringify({ email, password }), signal: controller.signal,\n    })\n    const payload = await readJson(response)\n    const session = sessionFromAuthPayload(payload)\n    if (!session) throw new Error('SESSION_NOT_RETURNED')\n    saveSession(session)\n    return session\n  } catch (error) {\n    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('SIGN_IN_TIMEOUT')\n    throw error\n  } finally {\n    window.clearTimeout(timeout)\n  }\n}`

if (!source.includes(oldBlock)) throw new Error('signInWithEmail anchor not found')
source = source.replace(oldBlock, newBlock)
fs.writeFileSync(path, source)
console.log('Forced active Supabase key and added sign-in timeout')
