import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
const check = (ok, message) => { if (!ok) failures.push(message) }
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''

const appPath = path.join(root, 'src', 'App.tsx')
const cssPath = path.join(root, 'src', 'V24.css')
const app = read(appPath)
const css = read(cssPath)

check(Boolean(app), 'src/App.tsx is missing; run npm run build first')
check(Boolean(css), 'src/V24.css is missing; run npm run build first')

if (app) {
  check(!/window\.setTimeout\([^\n]*dispatchOnlineAttack|setTimeout\(\(\) => \{\s*void dispatchOnlineAttack/s.test(app), 'online ATTACK is delayed before server dispatch')
  check(/snapshotVisibleCardRects\(\);\s*void dispatchOnlineAction\('SET_VS'/s.test(app), 'SET_VS does not snapshot card geometry before dispatch')
  check(/snapshotVisibleCardRects\(\);\s*void dispatchOnlineAction\('PLAY_EFFECT'/s.test(app), 'PLAY_EFFECT does not snapshot card geometry before dispatch')
  check(/snapshotVisibleCardRects\(\)[\s\S]{0,500}void dispatchOnlineAttack\(\)/.test(app), 'ATTACK does not snapshot card geometry before immediate dispatch')
}

if (css) {
  check(!/\.player-vs-card[^}]*max-height:\s*148px/i.test(css), 'degraded 148px portrait VS cap is still active')
  check(!/\.player-hand:not\(\.opponent-hand\)[^}]*\.hand-card-wrap[^}]*height:\s*114px/i.test(css), 'degraded 114px local hand-card rule is still active')
  check(/--mx-vs-max:\s*230px/i.test(css) || /max-height:\s*230px/i.test(css), 'offline portrait VS 230px allowance is missing')
}

function webpSize(file) {
  const b = fs.readFileSync(file)
  if (b.length < 30 || b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') throw new Error(`Not WebP: ${file}`)
  let o = 12
  while (o + 8 <= b.length) {
    const type = b.toString('ascii', o, o + 4)
    const len = b.readUInt32LE(o + 4)
    const d = o + 8
    if (type === 'VP8X' && d + 10 <= b.length) {
      return { width: 1 + b.readUIntLE(d + 4, 3), height: 1 + b.readUIntLE(d + 7, 3) }
    }
    if (type === 'VP8L' && d + 5 <= b.length) {
      const bits = b.readUInt32LE(d + 1)
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }
    }
    if (type === 'VP8 ' && d + 10 <= b.length) {
      return { width: b.readUInt16LE(d + 6) & 0x3fff, height: b.readUInt16LE(d + 8) & 0x3fff }
    }
    o = d + len + (len & 1)
  }
  throw new Error(`Unsupported WebP: ${file}`)
}

const game = path.join(root, 'public', 'cards', 'game', '01.webp')
const inspect = path.join(root, 'public', 'cards', 'inspect', '01.webp')
if (!fs.existsSync(game) || !fs.existsSync(inspect)) {
  failures.push('recovered gameplay/inspect card files are missing; run npm run build first')
} else {
  const g = webpSize(game)
  const i = webpSize(inspect)
  check(g.width >= 400 && g.height >= 590, `game card is too small: ${g.width}x${g.height}`)
  check(i.width >= 850 && i.height >= 1200, `inspect card is too small: ${i.width}x${i.height}`)
  check(!fs.readFileSync(game).equals(fs.readFileSync(inspect)), 'game and inspect card are the same emergency asset bytes')
}

// Gate 1 remains intentionally red until the backend-authoritative normal-turn deadline is added.
check(/turnDeadline|turn_deadline|actionDeadline|action_deadline/.test(app), 'client has no authoritative normal-turn deadline field yet')

if (failures.length) {
  console.error('GATE1_VERIFY_FAIL')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('GATE1_VERIFY_PASS')
