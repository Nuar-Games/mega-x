import fs from 'node:fs'
import path from 'node:path'

const source = path.resolve('recovery/landing-main-hq.webp.b64')
const target = path.resolve('public/ui/landing-main-hq.webp')
fs.mkdirSync(path.dirname(target), { recursive: true })
const raw = fs.readFileSync(source, 'utf8').replace(/\s+/g, '')
fs.writeFileSync(target, Buffer.from(raw, 'base64'))
console.log(`Recovered ${path.relative(process.cwd(), target)} (${fs.statSync(target).size} bytes)`)
