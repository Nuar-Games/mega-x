import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const testsOnly = process.argv.includes('--tests-only')
const run=(command,args=[])=>{
  console.log(`RUN ${command} ${args.join(' ')}`)
  const result=spawnSync(command,args,{stdio:'inherit',shell:process.platform==='win32'})
  if(result.status!==0){
    console.error(`FAILED ${command} ${args.join(' ')}`)
    process.exit(result.status??1)
  }
}

// This is the regression suite that npm run build ran before Phase 1.
// Keep the suite explicit so dormant historical test files do not silently become release gates.
const regressionFiles=[
  'security_permissions_regression.mjs','password_recovery_regression.mjs','admin_controls_regression.mjs','release_metadata_regression.mjs','landing_main_regression.mjs','guest_practice_landing_cta_regression.mjs','guest_first_leaderboard_auth_regression.mjs','card_logic_audit_regression.mjs','core_rules_revision_regression.mjs','naga_one_shot_regression.mjs','no_vs_safe_endpoint_regression.mjs','tie_breaker_choice_regression.mjs','engine_behavior_regression.mjs','engine_full_match_lifecycle_regression.mjs','gameplay_flow_regression.mjs','practice_guest_entry_regression.mjs','practice_guest_no_network_regression.mjs','practice_human_first_round_regression.mjs','practice_bot_first_round_regression.mjs','practice_bot_pacing_regression.mjs','practice_deck_exhaustion_regression.mjs','practice_real_exhaustion_lifecycle_regression.mjs','arena_next_contract_regression.mjs','arena_next_prototype_regression.mjs','arena_next_event_pipeline_regression.mjs','arena_next_live_match_regression.mjs','arena_next_root_cutover_regression.mjs','arena_next_scene_boot_race_regression.mjs','arena_legacy_path_guard_regression.mjs','arena_next_pipeline_guard_regression.mjs','supabase_config_source_of_truth_regression.mjs'
].map(name=>`tests/${name}`)

const staleInfrastructure=/scripts\/(?:patch-|recover-|diagnose-)|(?:^|['"`])(?:recovery|_restore)\//m
const staleTests=regressionFiles
  .filter(file=>!file.endsWith('arena_next_pipeline_guard_regression.mjs'))
  .filter(file=>staleInfrastructure.test(readFileSync(file,'utf8')))
if(staleTests.length){
  console.error('REGRESSION_TESTS_STILL_DEPEND_ON_DELETED_GENERATORS')
  for(const file of staleTests)console.error(`- ${file}`)
  process.exit(1)
}

if(testsOnly){
  for(const file of regressionFiles)run('node',[file])
  console.log(`BUILD_REGRESSION_SUITE_PASS count=${regressionFiles.length}`)
}else{
  run('npm',['run','build'])
  console.log('FULL_VERIFY_PASS')
}