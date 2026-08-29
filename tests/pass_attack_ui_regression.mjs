import fs from 'node:fs'

const app = fs.readFileSync('src/App.tsx', 'utf8')
const css = fs.readFileSync('src/V24.css', 'utf8')

function assert(ok, message) {
  if (!ok) throw new Error(message)
}

assert(
  app.includes("game.message.includes('peluang serangan') && game.message.includes('disekat')"),
  'blocked-attack state is not surfaced in the arena UI',
)
assert(
  app.includes('mx-attack-blocked-slam'),
  'blocked-attack arena slam is missing',
)
assert(
  css.includes('/* Attack-block feedback */'),
  'blocked-attack visual feedback CSS is missing',
)

console.log('PASS attack-block feedback is explicit in the arena UI')
