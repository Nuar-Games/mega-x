import fs from 'node:fs'
import crypto from 'node:crypto'
import zlib from 'node:zlib'

const names = ['00','01a','01b','02','03','04','05','06','07','08','09']
const parts = names.map((n) => fs.readFileSync(`recovery/css/${n}.b64`, 'utf8').trim())
const raw = zlib.brotliDecompressSync(Buffer.from(parts.join(''), 'base64'))
const sha = crypto.createHash('sha256').update(raw).digest('hex')
const expected = '917b7f912d3b69a4f36397ed28656be214eca784d054f9964b82836bb9f5c544'
if (sha !== expected) throw new Error(`Recovered CSS checksum mismatch: ${sha}`)
const files = JSON.parse(raw.toString('utf8'))
fs.mkdirSync('src', { recursive: true })
for (const [name, content] of Object.entries(files)) fs.writeFileSync(`src/${name}`, content)
console.log(`Recovered ${Object.keys(files).length} CSS files (${sha})`)
