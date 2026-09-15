import { spawnSync } from 'node:child_process'

const run=(command,args=[])=>{
  const result=spawnSync(command,args,{stdio:'inherit',shell:process.platform==='win32'})
  if(result.status!==0)process.exit(result.status??1)
}

run('node',['scripts/recover-app.mjs'])

const tests=[
  'security_permissions_regression.mjs',
  'password_recovery_regression.mjs',
  'admin_controls_regression.mjs',
  'release_metadata_regression.mjs',
  'mobile_wake_lock_regression.mjs',
  'discard_direct_image_regression.mjs',
  'landing_main_regression.mjs',
  'card_logic_audit_regression.mjs',
  'core_rules_revision_regression.mjs',
  'naga_one_shot_regression.mjs',
  'no_vs_safe_endpoint_regression.mjs',
  'tie_breaker_choice_regression.mjs',
  'engine_behavior_regression.mjs',
  'gameplay_flow_regression.mjs',
  'practice_human_first_round_regression.mjs',
  'practice_deck_exhaustion_regression.mjs',
  'practice_real_exhaustion_lifecycle_regression.mjs',
  'arena_clean_asset_manifest_regression.mjs',
  'arena_clean_layout_regression.mjs'
]

for(const file of tests)run('node',[`tests/${file}`])
run('npx',['tsc'])
run('npx',['vite','build'])
