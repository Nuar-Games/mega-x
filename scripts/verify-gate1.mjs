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
  const hasRecoveredHandRule = /Recovery online-feel portrait scale/.test(css) && /\.duel-shell \.player-hand:not\(\.opponent-hand\) \.hand-card-wrap\{height:\s*154px!important;max-height:\s*154px!important/i.test(css)
  check(hasRecoveredHandRule, 'recovered 154px local hand-card override is missing')
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

check(/turnDeadline|turn_deadline|actionDeadline|action_deadline/.test(app), 'client has no authoritative normal-turn deadline field yet')

const securityMigration = read(path.join(root, 'supabase', 'migrations', '20260912_security_definer_hardening.sql'))
check(Boolean(securityMigration), 'security definer hardening migration is missing')
if (securityMigration) {
  check(/revoke execute on function public\.admin_list_players\(\) from public, anon/i.test(securityMigration), 'admin_list_players is not explicitly revoked from public/anon')
  check(/revoke execute on function public\.admin_set_silenced\(uuid,boolean\) from public, anon/i.test(securityMigration), 'admin_set_silenced is not explicitly revoked from public/anon')
  check(/revoke execute on function public\.admin_set_suspended\(uuid,boolean\) from public, anon/i.test(securityMigration), 'admin_set_suspended is not explicitly revoked from public/anon')
  check(/revoke execute on function public\.assign_pending_admin\(\) from public, anon, authenticated/i.test(securityMigration), 'trigger-only assign_pending_admin is remotely executable')
  check(/revoke execute on function public\.handle_new_auth_user\(\) from public, anon, authenticated/i.test(securityMigration), 'trigger-only handle_new_auth_user is remotely executable')
  check(/grant execute on function public\.admin_list_players\(\) to authenticated/i.test(securityMigration), 'admin_list_players authenticated grant is missing')
}

const authSource = read(path.join(root, 'src', 'onlineAuth.ts'))
const resetPage = read(path.join(root, 'public', 'reset-password.html'))
check(/export async function requestPasswordReset\(/.test(authSource), 'requestPasswordReset auth helper is missing')
check(/\/auth\/v1\/recover/.test(authSource), 'password recovery endpoint is missing')
check(/export function consumeRecoverySessionFromHash\(/.test(authSource), 'recovery-session hash consumer is missing')
check(/export async function updatePassword\(/.test(authSource), 'updatePassword auth helper is missing')
check(/\/auth\/v1\/user/.test(authSource), 'password update endpoint is missing')
check(/FORGOT PASSWORD\?/i.test(app), 'AUTH screen has no FORGOT PASSWORD action')
check(Boolean(resetPage), 'reset-password.html is missing')
if (resetPage) {
  check(/type=recovery|type['"]?\s*[:=]\s*['"]recovery/i.test(resetPage), 'reset page does not verify recovery flow')
  check(/NEW PASSWORD/i.test(resetPage), 'reset page has no new-password UI')
  check(/\/auth\/v1\/user/.test(resetPage), 'reset page does not update password through Supabase Auth')
}

if (failures.length) {
  console.error('GATE1_VERIFY_FAIL')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('GATE1_VERIFY_PASS')
