-- Mega X 1.1 security hardening: least-privilege EXECUTE grants for SECURITY DEFINER routines.
-- Intentional anonymous SECURITY DEFINER surface retained only for landing metrics/visit RPCs:
-- get_completed_fight_count(), get_lobby_metrics(), record_lobby_visit(), record_lobby_visit(text).

-- Internal helpers are never client-callable.
revoke execute on function public.is_admin(uuid) from public, anon, authenticated;
revoke execute on function public.account_silenced(uuid) from public, anon, authenticated;
revoke execute on function public.account_suspended(uuid) from public, anon, authenticated;
revoke execute on function public.assert_account_active() from public, anon, authenticated;
revoke execute on function public.assign_pending_admin() from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.guard_match_card_integrity_trigger() from public, anon, authenticated;

-- Admin client RPCs require a signed-in session; each routine also performs its own server-side admin check.
revoke execute on function public.get_my_admin_status() from public, anon;
revoke execute on function public.admin_list_players() from public, anon;
revoke execute on function public.admin_set_silenced(uuid,boolean) from public, anon;
revoke execute on function public.admin_set_suspended(uuid,boolean) from public, anon;
grant execute on function public.get_my_admin_status() to authenticated;
grant execute on function public.admin_list_players() to authenticated;
grant execute on function public.admin_set_silenced(uuid,boolean) to authenticated;
grant execute on function public.admin_set_suspended(uuid,boolean) to authenticated;

-- Authenticated-only game/account RPCs that were inheriting PostgreSQL's default PUBLIC EXECUTE.
revoke execute on function public.get_my_active_match_vs_intro() from public, anon;
revoke execute on function public.join_matchmaking_vs_intro() from public, anon;
revoke execute on function public.respond_to_challenge_vs_intro(uuid,boolean) from public, anon;
revoke execute on function public.start_match_direct_safe(uuid) from public, anon;
revoke execute on function public.start_vs_intro_match(uuid) from public, anon;

grant execute on function public.get_my_active_match_vs_intro() to authenticated;
grant execute on function public.join_matchmaking_vs_intro() to authenticated;
grant execute on function public.respond_to_challenge_vs_intro(uuid,boolean) to authenticated;
grant execute on function public.start_match_direct_safe(uuid) to authenticated;
grant execute on function public.start_vs_intro_match(uuid) to authenticated;

-- Explicitly keep the match engine state RPC service-only.
revoke execute on function public.get_match_engine_state(uuid,uuid) from public, anon, authenticated;
grant execute on function public.get_match_engine_state(uuid,uuid) to service_role;
