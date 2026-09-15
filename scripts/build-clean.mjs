import { spawnSync } from 'node:child_process'

const run=(command,args=[])=>{
  const result=spawnSync(command,args,{stdio:'inherit',shell:process.platform==='win32'})
  if(result.status!==0)process.exit(result.status??1)
}

const prepare=[
  'recover-app.mjs','diagnose-discard-markup.mjs','diagnose-leaderboard-markup.mjs','inspect-auth-app.mjs','recover-css.mjs','recover-cards.mjs','recover-landing-assets.mjs',
  'patch-auth-key.mjs','patch-auth-runtime.mjs','patch-online-feel.mjs','patch-coin-toss-presentation.mjs','patch-network-load.mjs','patch-realtime-load.mjs','patch-critical-gameplay.mjs','patch-polish.mjs','patch-resilience.mjs','patch-arena-flow.mjs','patch-user-feedback.mjs','patch-first-place-glow.mjs','patch-attack-block-feedback.mjs','patch-mobile-lobby.mjs','patch-arena-mobile-audit.mjs','patch-gameplay-flow-regressions.mjs','patch-engine-behavior-core-rules.mjs','patch-vs-card-id-anchors.mjs','patch-arena-blueprint-structure.mjs','patch-tie-breaker-choice.mjs','patch-arena-usability.mjs','patch-vs-intro-flow.mjs','patch-audio-mobile.mjs','patch-production-jank-hotfix.mjs','patch-leaderboard-spacing.mjs','patch-vs-intro-consistency.mjs','hotfix-discard-build.mjs','patch-arena-ownership-choice.mjs','patch-discard-direct-image.mjs','patch-mobile-wake-lock.mjs','patch-final-arena-touchup.mjs','patch-practice-real-arena.mjs','patch-practice-effect-control.mjs','diagnose-final-discard-css.mjs','diagnose-lobby-presence.mjs','diagnose-final-roster.mjs','patch-practice-dead-turn.mjs','patch-practice-deck-exhaustion.mjs','patch-practice-quit.mjs','patch-admin-controls.mjs'
]
for(const file of prepare)run('node',[`scripts/${file}`])

const tests=[
  'security_permissions_regression.mjs','password_recovery_regression.mjs','admin_controls_regression.mjs','release_metadata_regression.mjs','mobile_wake_lock_regression.mjs','discard_direct_image_regression.mjs','landing_main_regression.mjs','guest_practice_landing_cta_regression.mjs','card_logic_audit_regression.mjs','core_rules_revision_regression.mjs','naga_one_shot_regression.mjs','no_vs_safe_endpoint_regression.mjs','tie_breaker_choice_regression.mjs','engine_behavior_regression.mjs','gameplay_flow_regression.mjs','practice_guest_entry_regression.mjs','practice_human_first_round_regression.mjs','practice_deck_exhaustion_regression.mjs','practice_real_exhaustion_lifecycle_regression.mjs','arena_performance_fullscreen_regression.mjs','arena_clean_asset_manifest_regression.mjs','arena_clean_layout_regression.mjs','arena_clean_interaction_regression.mjs','arena_clean_loading_regression.mjs'
]
for(const file of tests)run('node',[`tests/${file}`])
run('node',['scripts/verify-gate1.mjs'])
run('npx',['tsc'])
run('npx',['vite','build'])
