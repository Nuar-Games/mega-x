import fs from 'node:fs'
import crypto from 'node:crypto'
import zlib from 'node:zlib'

const parts = ['00','01','02','03','04','05'].map((n) => fs.readFileSync(`recovery/app/${n}.b64`, 'utf8').trim())
const source = zlib.gunzipSync(Buffer.from(parts.join(''), 'base64'))
const sha = crypto.createHash('sha256').update(source).digest('hex')
const expected = '6109f93001451f716647f737e7f1eabbce753e2cb8e03bfcc314bfcd65fb960f'
if (sha !== expected) throw new Error(`Recovered App.tsx checksum mismatch: ${sha}`)
fs.mkdirSync('src', { recursive: true })
fs.writeFileSync('src/App.tsx', source)
console.log(`Recovered src/App.tsx (${source.length} bytes, ${sha})`)
