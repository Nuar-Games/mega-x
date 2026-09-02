import fs from 'node:fs'
import path from 'node:path'

const chunkTargets = [
  ['left', 'public/ui/landing/left.avif'],
  ['right', 'public/ui/landing/right.avif'],
]

for (const [name, output] of chunkTargets) {
  const dir = `recovery/landing-assets/${name}`
  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.b64')).sort()
  const base64 = files.map((file) => fs.readFileSync(path.join(dir, file), 'utf8')).join('').replace(/\s+/g, '')
  fs.mkdirSync(path.dirname(output), { recursive: true })
  fs.writeFileSync(output, Buffer.from(base64, 'base64'))
  const bytes = fs.statSync(output).size
  if (!bytes) throw new Error(`Failed to recover ${name}`)
  console.log(`RECOVER LANDING ${name.toUpperCase()} ${bytes}`)
}

const fixedTargets = [
  ['right-fixed', 'public/ui/landing/right-fixed.avif'],
  ['background-fixed', 'public/ui/landing/background-fixed.avif'],
]

for (const [name, output] of fixedTargets) {
  const source = `recovery/landing-assets/${name}.b64`
  const base64 = fs.readFileSync(source, 'utf8').replace(/\s+/g, '')
  fs.mkdirSync(path.dirname(output), { recursive: true })
  fs.writeFileSync(output, Buffer.from(base64, 'base64'))
  const bytes = fs.statSync(output).size
  if (!bytes) throw new Error(`Failed to recover ${name}`)
  console.log(`RECOVER LANDING ${name.toUpperCase()} ${bytes}`)
}
