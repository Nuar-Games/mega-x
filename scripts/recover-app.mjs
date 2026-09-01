import fs from 'node:fs'
import crypto from 'node:crypto'
import zlib from 'node:zlib'

const parts = ['00','01','02','03','04','05'].map((n) => fs.readFileSync(`recovery/app/${n}.b64`, 'utf8').trim())
const source = zlib.gunzipSync(Buffer.from(parts.join(''), 'base64'))
const sha = crypto.createHash('sha256').update(source).digest('hex')
const expected = 'd09b13bd41b007a7c313377d7ba301b60a980b95677c5f9427dc4d2d703d1a6d'
if (sha !== expected) throw new Error(`Recovered App.tsx checksum mismatch: ${sha}`)
fs.mkdirSync('src', { recursive: true })
fs.writeFileSync('src/App.tsx', source)
console.log(`Recovered src/App.tsx (${source.length} bytes, ${sha})`)
