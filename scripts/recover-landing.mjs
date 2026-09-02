import fs from 'node:fs'
import path from 'node:path'

const source = path.resolve('recovery/landing-main-hq-720.webp.b64')
const target = path.resolve('public/ui/landing-main-hq.webp')
fs.mkdirSync(path.dirname(target), { recursive: true })
const raw = fs.readFileSync(source, 'utf8').replace(/\s+/g, '')
const decoded = Buffer.from(raw, 'base64')
fs.writeFileSync(target, decoded)
if (decoded.length < 150000) throw new Error(`Landing artwork recovery is unexpectedly small: ${decoded.length} bytes`)
console.log(`Recovered ${path.relative(process.cwd(), target)} (${decoded.length} bytes)`)
