import fs from 'node:fs'

const hardening = fs.readFileSync('supabase/migrations/20260912_security_definer_hardening.sql', 'utf8').toLowerCase()
const lobbyTableHardening = fs.readFileSync('supabase/migrations/20260913_lobby_visits_table_privilege_hardening.sql', 'utf8').toLowerCase()
const failures = []
const check = (ok, message) => { if (!ok) failures.push(message) }

const privateHelpers = [
  'is_admin(uuid)',
  'account_silenced(uuid)',
  'account_suspended(uuid)',
  'assert_account_active()',
  'assign_pending_admin()',
  'handle_new_auth_user()',
  'guard_match_card_integrity_trigger()',
]

for (const signature of privateHelpers) {
  check(
    hardening.includes(`revoke execute on function public.${signature} from public, anon, authenticated`),
    `${signature} must be revoked from public, anon, authenticated`,
  )
}

const adminRpcs = [
  'get_my_admin_status()',
  'admin_list_players()',
  'admin_set_silenced(uuid,boolean)',
  'admin_set_suspended(uuid,boolean)',
]
for (const signature of adminRpcs) {
  check(
    hardening.includes(`revoke execute on function public.${signature} from public, anon`),
    `${signature} must not be callable by public/anon`,
  )
  check(
    hardening.includes(`grant execute on function public.${signature} to authenticated`),
    `${signature} authenticated grant missing`,
  )
}

const authenticatedGameRpcs = [
  'get_my_active_match_vs_intro()',
  'join_matchmaking_vs_intro()',
  'respond_to_challenge_vs_intro(uuid,boolean)',
  'start_match_direct_safe(uuid)',
  'start_vs_intro_match(uuid)',
]
for (const signature of authenticatedGameRpcs) {
  check(
    hardening.includes(`revoke execute on function public.${signature} from public, anon`),
    `${signature} must not be callable by public/anon`,
  )
  check(
    hardening.includes(`grant execute on function public.${signature} to authenticated`),
    `${signature} authenticated grant missing`,
  )
}

check(
  hardening.includes('revoke execute on function public.get_match_engine_state(uuid,uuid) from public, anon, authenticated'),
  'get_match_engine_state must be revoked from all client roles',
)
check(
  hardening.includes('grant execute on function public.get_match_engine_state(uuid,uuid) to service_role'),
  'get_match_engine_state service_role grant missing',
)

for (const signature of ['get_completed_fight_count()', 'get_lobby_metrics()', 'record_lobby_visit()', 'record_lobby_visit(text)']) {
  check(
    hardening.includes(signature),
    `${signature} intentional anonymous surface is undocumented in hardening migration`,
  )
}

check(
  lobbyTableHardening.includes('revoke all privileges on table public.lobby_visits from anon, authenticated'),
  'lobby_visits direct table privileges must be revoked from anon/authenticated',
)

if (failures.length) {
  console.error('SECURITY_PERMISSIONS_REGRESSION_FAIL')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('SECURITY_PERMISSIONS_REGRESSION_PASS')
