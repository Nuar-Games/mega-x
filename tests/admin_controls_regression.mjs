import fs from 'node:fs'

const auth = fs.readFileSync('src/onlineAuth.ts', 'utf8')
const app = fs.readFileSync('src/App.tsx', 'utf8')
const moderation = fs.readFileSync('supabase/migrations/20260912_admin_moderation.sql', 'utf8')
const hardening = fs.readFileSync('supabase/migrations/20260912_security_definer_hardening.sql', 'utf8')

const failures = []
const check = (ok, message) => { if (!ok) failures.push(message) }

check(/export async function getMyAdminStatus/.test(auth), 'getMyAdminStatus client helper missing')
check(/export async function adminListPlayers/.test(auth), 'adminListPlayers client helper missing')
check(/export async function adminSetSilenced/.test(auth), 'adminSetSilenced client helper missing')
check(/export async function adminSetSuspended/.test(auth), 'adminSetSuspended client helper missing')
check(/rpcAuthed\(session, 'admin_set_silenced'/.test(auth), 'mute RPC is not authenticated')
check(/rpcAuthed\(session, 'admin_set_suspended'/.test(auth), 'ban RPC is not authenticated')

check(/mxIsAdmin\s*&&[^\n]*ADMIN/.test(app), 'ADMIN button is not gated by admin status')
check(/mega-x-admin-panel/.test(app), 'admin player-control panel missing')
check(/'MUTE',!p\.silenced/.test(app) && /UNMUTE/.test(app), 'mute/unmute UI wiring missing')
check(/'BAN',!p\.suspended/.test(app) && /UNBAN/.test(app), 'ban/unban UI wiring missing')
check(/status\?\.suspended[\s\S]*signOut/.test(app), 'suspended-session forced sign-out guard missing')

for (const fn of ['admin_list_players', 'admin_set_silenced', 'admin_set_suspended']) {
  const start = moderation.indexOf(`function public.${fn}`)
  check(start >= 0, `${fn} migration function missing`)
  if (start >= 0) {
    const block = moderation.slice(start, start + 2400)
    check(/ADMIN_REQUIRED/.test(block), `${fn} does not enforce ADMIN_REQUIRED server-side`)
  }
}
check(/CANNOT_MODERATE_SELF/.test(moderation), 'self-moderation guard missing')
check(/where not exists\(select 1 from public\.admin_users/.test(moderation), 'admin accounts are not excluded from player moderation list')

for (const signature of ['admin_list_players()', 'admin_set_silenced(uuid,boolean)', 'admin_set_suspended(uuid,boolean)']) {
  check(hardening.toLowerCase().includes(`revoke execute on function public.${signature} from public, anon`), `${signature} remains public/anon executable`)
  check(hardening.toLowerCase().includes(`grant execute on function public.${signature} to authenticated`), `${signature} authenticated grant missing`)
}

if (failures.length) {
  console.error('ADMIN_CONTROLS_REGRESSION_FAIL')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ADMIN_CONTROLS_REGRESSION_PASS')
